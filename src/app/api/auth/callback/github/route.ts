import { NextResponse } from 'next/server';

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

    if (data.error) {
      console.error('GitHub OAuth Error:', data.error_description);
      return NextResponse.redirect(new URL(`/?error=${data.error}`, request.url));
    }

    // 将 token 通过 URL 传递给前端处理页
    const redirectUrl = new URL('/auth/success', request.url);
    redirectUrl.searchParams.set('access_token', data.access_token);
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Token exchange failed:', error);
    return NextResponse.redirect(new URL('/?error=exchange_failed', request.url));
  }
}
