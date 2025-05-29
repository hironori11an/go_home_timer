export interface FCMMessage {
  token: string;
  notification: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
  };
  data?: Record<string, string>;
  webpush?: {
    headers?: Record<string, string>;
    data?: Record<string, unknown>;
    notification?: {
      actions?: Array<{
        action: string;
        title: string;
        icon?: string;
      }>;
    };
  };
}

export interface Bindings {
  FCM_PROJECT_ID: string;
  FCM_PRIVATE_KEY: string;
  FCM_CLIENT_EMAIL: string;
}

export class FCMService {
  private projectId: string;
  private privateKey: string;
  private clientEmail: string;

  constructor(bindings: Bindings) {
    this.projectId = bindings.FCM_PROJECT_ID;
    this.privateKey = bindings.FCM_PRIVATE_KEY.replace(/\\n/g, '\n');
    this.clientEmail = bindings.FCM_CLIENT_EMAIL;
  }

  private async importPrivateKey(pem: string): Promise<CryptoKey> {
    // PEMからヘッダーとフッターを削除してbase64部分のみ取得
    const pemHeader = '-----BEGIN PRIVATE KEY-----';
    const pemFooter = '-----END PRIVATE KEY-----';
    const pemContents = pem.replace(pemHeader, '').replace(pemFooter, '').replace(/\s/g, '');
    
    // Base64デコード
    const binaryString = atob(pemContents);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // CryptoKeyとしてインポート
    return await crypto.subtle.importKey(
      'pkcs8',
      bytes,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );
  }

  private async createJWT(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 3600; // 1時間後

    // JWTヘッダー
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };

    // JWTペイロード
    const payload = {
      iss: this.clientEmail,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: exp,
    };

    // ヘッダーとペイロードをBase64URL エンコード
    const headerBase64 = this.base64UrlEncode(JSON.stringify(header));
    const payloadBase64 = this.base64UrlEncode(JSON.stringify(payload));

    // 署名対象の文字列
    const signatureInput = `${headerBase64}.${payloadBase64}`;

    // 秘密鍵で署名
    const privateKey = await this.importPrivateKey(this.privateKey);
    const signatureArrayBuffer = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      new TextEncoder().encode(signatureInput)
    );

    // 署名をBase64URLエンコード
    const signatureBase64 = this.base64UrlEncode(signatureArrayBuffer);

    return `${signatureInput}.${signatureBase64}`;
  }

  private base64UrlEncode(data: string | ArrayBuffer): string {
    let base64: string;
    
    if (typeof data === 'string') {
      base64 = btoa(data);
    } else {
      const bytes = new Uint8Array(data);
      let binaryString = '';
      for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
      }
      base64 = btoa(binaryString);
    }

    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private async getAccessToken(): Promise<string> {
    const jwt = await this.createJWT();

    // OAuth2 トークンリクエスト
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Failed to get access token: ${errorText}`);
    }

    const tokenData = await tokenResponse.json() as { access_token: string };
    return tokenData.access_token;
  }

  async sendMessage(message: FCMMessage): Promise<Response> {
    const accessToken = await this.getAccessToken();
    
    const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`;
    
    const payload = {
      message: {
        token: message.token,
        notification: message.notification,
        data: message.data,
        webpush: message.webpush,
      },
    };

    const response = await fetch(fcmEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return response;
  }

  async sendToMultipleTokens(tokens: string[], notification: FCMMessage['notification'], data?: Record<string, string>): Promise<Response[]> {
    const promises = tokens.map(token => 
      this.sendMessage({
        token,
        notification,
        data,
      })
    );

    return Promise.all(promises);
  }
} 