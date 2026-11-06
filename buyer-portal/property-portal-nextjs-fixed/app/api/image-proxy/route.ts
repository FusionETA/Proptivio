/**
 * Image Proxy API Route - SIMPLIFIED VERSION
 * Handles authenticated image requests to Bitrix24
 */

import { NextRequest, NextResponse } from 'next/server';

const BITRIX24_EMAIL = process.env.BITRIX24_LOGIN_EMAIL!;
const BITRIX24_PASSWORD = process.env.BITRIX24_LOGIN_PASSWORD!;
const BITRIX24_DOMAIN = process.env.BITRIX24_DOMAIN!;
const WEBHOOK_URL = process.env.NEXT_PUBLIC_BITRIX24_WEBHOOK!;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fileId = searchParams.get('fileId');
  const ownerId = searchParams.get('ownerId');
  const fieldName = searchParams.get('fieldName');

  if (!fileId || !ownerId || !fieldName) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    // Get file metadata
    const apiUrl = `${WEBHOOK_URL}crm.deal.get?ID=${encodeURIComponent(ownerId)}`;
    const metaResponse = await fetch(apiUrl);
    const dealData = await metaResponse.json();

    if (!dealData.result || !dealData.result[fieldName]) {
      console.error(`Field ${fieldName} not found in deal ${ownerId}`);
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    const files = dealData.result[fieldName];
    const targetFile = files.find((f: any) => String(f.id) === String(fileId));

    if (!targetFile) {
      console.error(`File ${fileId} not found in field ${fieldName}`);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const relativeUrl = targetFile.downloadUrl || targetFile.showUrl || '';
    if (!relativeUrl) {
      console.error('No URL found in file data');
      return NextResponse.json({ error: 'No URL found' }, { status: 404 });
    }

    // Build full URL and clean it
    const fileUrl = `${BITRIX24_DOMAIN}${relativeUrl}`;
    const urlObj = new URL(fileUrl);
    urlObj.searchParams.delete('auth'); // Remove any existing auth param
    const cleanUrl = urlObj.toString();

    console.log(`Attempting to fetch: ${cleanUrl}`);

    // === FALLBACK EXPERIMENT: Try `disk.file.get` first ===
    // If the file is a Disk file, we can get a secure download link via the Webhook
    // This avoids the fragile "mimic browser login" step entirely.
    if (fileId) {
      try {
        const diskUrl = `${WEBHOOK_URL}disk.file.get?id=${fileId}`;
        const diskResp = await fetch(diskUrl);
        const diskData = await diskResp.json();

        if (diskData.result && diskData.result.DOWNLOAD_URL) {
          console.log("Found DOWNLOAD_URL via disk.file.get! Using this instead of scraping.");
          // Fetch the image from the secure REST URL
          const secureImgResp = await fetch(diskData.result.DOWNLOAD_URL);
          if (secureImgResp.ok) {
            const imgBuf = await secureImgResp.arrayBuffer();
            const cType = secureImgResp.headers.get('content-type') || 'image/jpeg';
            return new NextResponse(imgBuf, {
              status: 200,
              headers: {
                'Content-Type': cType,
                'Cache-Control': 'private, max-age=3600',
              },
            });
          }
        } else {
          console.log("disk.file.get failed. Response:", JSON.stringify(diskData));
          console.log("disk.file.get did not return a DOWNLOAD_URL. Falling back to login scraping.");
        }
      } catch (err) {
        console.log("disk.file.get exception:", err);
      }
    }


    // === LOGIN SEQUENCE (matching PHP exactly) ===
    let cookies: string[] = [];
    const manualCookieString = process.env.BITRIX24_COOKIE_STRING;
    const manualSessionId = process.env.BITRIX24_PHPSESSID;
    let forcedCookieHeader = '';

    if (manualCookieString) {
      console.log('Using manual BITRIX24_COOKIE_STRING override');
      forcedCookieHeader = manualCookieString;
      cookies = ['MANUAL_MODE']; // pass length check
    } else if (manualSessionId) {
      console.log('Using manual BITRIX24_PHPSESSID override');
      cookies.push(`PHPSESSID=${manualSessionId}`);
    } else {
      // Step 1: GET /auth/ to initialize session
      try {
        const initResponse = await fetch(`${BITRIX24_DOMAIN}/auth/`, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
          redirect: 'manual',
        });

        // Extract cookies from init
        cookies = extractSetCookies(initResponse);
        console.log(`Step 1: Got ${cookies.length} cookies from GET /auth/`);

        // Step 2: POST /auth/ with credentials
        const loginBody = new URLSearchParams({
          'AUTH_FORM': 'Y',
          'TYPE': 'AUTH',
          'backurl': '/',
          'USER_LOGIN': BITRIX24_EMAIL,
          'USER_PASSWORD': BITRIX24_PASSWORD,
          'USER_REMEMBER': 'Y',
        });

        const loginResponse = await fetch(`${BITRIX24_DOMAIN}/auth/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Cookie': buildCookieHeader(cookies),
            'Origin': BITRIX24_DOMAIN,
            'Referer': `${BITRIX24_DOMAIN}/auth/`,
            'Upgrade-Insecure-Requests': '1',
          },
          body: loginBody.toString(),
          redirect: 'manual',
        });

        // Merge cookies from login
        const loginCookies = extractSetCookies(loginResponse);
        cookies = mergeCookies(cookies, loginCookies);
        console.log(`Step 2: Login Status: ${loginResponse.status}, Location: ${loginResponse.headers.get('location')}`);
        console.log(`Step 2: Login Cookies received: ${loginCookies.length}`);
        console.log(`Step 2: Total cookies after login: ${cookies.length}`);
      } catch (authErr) {
        console.error('Auth sequence failed:', authErr);
      }
    }

    if (cookies.length === 0) {
      console.error('Login failed: No cookies received');
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    // Step 3: Fetch image with authenticated session
    const cookieHeader = forcedCookieHeader || buildCookieHeader(cookies);
    console.log(`Step 3: Fetching image with ${cookies.length} cookies`);

    const imageResponse = await fetch(cleanUrl, {
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': `${BITRIX24_DOMAIN}/crm/deal/details/${ownerId}/`,
      },
      redirect: 'follow', // Let fetch follow redirects for the image
    });

    if (!imageResponse.ok) {
      console.error(`Image fetch failed: ${imageResponse.status} ${imageResponse.statusText}`);
      return NextResponse.json({ error: `Image fetch failed: ${imageResponse.status}` }, { status: imageResponse.status });
    }

    const contentType = imageResponse.headers.get('content-type') || '';

    // Check if we got HTML instead of image (means auth failed)
    if (contentType.includes('text/html')) {
      console.error('Got HTML response - auth likely failed');
      return NextResponse.json({ error: 'Authentication verification failed' }, { status: 403 });
    }

    // Success! Return the image
    const imageBuffer = await imageResponse.arrayBuffer();
    console.log(`Success! Returning image (${imageBuffer.byteLength} bytes, ${contentType})`);

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    });

  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper: Extract Set-Cookie headers
function extractSetCookies(response: Response): string[] {
  const cookies: string[] = [];

  // Try modern API first
  if (typeof (response.headers as any).getSetCookie === 'function') {
    const setCookies = (response.headers as any).getSetCookie();
    if (Array.isArray(setCookies)) {
      return setCookies;
    }
  }

  // Fallback
  const setCookieHeader = response.headers.get('set-cookie');
  if (setCookieHeader) {
    cookies.push(setCookieHeader);
  }

  return cookies;
}

// Helper: Build Cookie header from array of Set-Cookie strings
function buildCookieHeader(setCookies: string[]): string {
  const cookieMap = new Map<string, string>();

  setCookies.forEach(setCookie => {
    // Extract name=value (first part before semicolon)
    const nameValue = setCookie.split(';')[0].trim();
    const separator = nameValue.indexOf('=');
    if (separator > 0) {
      const name = nameValue.substring(0, separator);
      const value = nameValue.substring(separator + 1);
      cookieMap.set(name, value);
    }
  });

  return Array.from(cookieMap.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

// Helper: Merge two cookie arrays
function mergeCookies(existing: string[], newCookies: string[]): string[] {
  const map = new Map<string, string>();

  // Add existing cookies
  existing.forEach(cookie => {
    const nameValue = cookie.split(';')[0].trim();
    const separator = nameValue.indexOf('=');
    if (separator > 0) {
      map.set(nameValue.substring(0, separator), cookie);
    }
  });

  // Override with new cookies
  newCookies.forEach(cookie => {
    const nameValue = cookie.split(';')[0].trim();
    const separator = nameValue.indexOf('=');
    if (separator > 0) {
      map.set(nameValue.substring(0, separator), cookie);
    }
  });

  return Array.from(map.values());
}
