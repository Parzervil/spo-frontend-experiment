import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const data = await response.json();

    if (data.error || !data.access_token) {
      console.error('GitHub OAuth Error:', data.error_description || data.error);
      return NextResponse.redirect(new URL(`/?error=${data.error || 'no_token'}`, request.url));
    }

    const redirectUrl = new URL('/auth/success', request.url);
    redirectUrl.searchParams.set('access_token', data.access_token);

    // 服务端直接预拉取 GitHub 用户信息，避免前端受限于网络环境导致掉线
    try {
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
          'User-Agent': 'SPO-Platform',
          Accept: 'application/vnd.github.v3+json',
        },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData?.login) {
          redirectUrl.searchParams.set('user_login', userData.login);
          redirectUrl.searchParams.set('user_avatar', userData.avatar_url || '');
          redirectUrl.searchParams.set('user_name', userData.name || userData.login);
        }
      }
    } catch (userErr) {
      console.warn('Failed to pre-fetch user info on server:', userErr);
    }
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Token exchange failed:', error);
    return NextResponse.redirect(new URL('/?error=exchange_failed', request.url));
  }
}
