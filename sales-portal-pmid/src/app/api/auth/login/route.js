import { bitrix24 } from '@/lib/bitrix24';

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return Response.json({
                success: false,
                error: 'Email and password are required'
            }, { status: 400 });
        }

        // Get user by email
        const userResponse = await bitrix24.getUserByEmail(email);

        if (!userResponse.result || userResponse.result.length === 0) {
            return Response.json({
                success: false,
                error: 'Invalid email or password'
            }, { status: 401 });
        }

        const user = userResponse.result[0];

        // Check if user is active
        // if (user.ACTIVE !== 'Y' && user.ACTIVE !== true) {
        //     return Response.json({
        //         success: false,
        //         error: 'Account is not active'
        //     }, { status: 401 });
        // }

        // Verify password against shared portal password from env
        const portalPassword = process.env.PORTAL_PASSWORD;
        if (!portalPassword || password !== portalPassword) {
            return Response.json({
                success: false,
                error: 'Invalid email or password'
            }, { status: 401 });
        }

        // Return user data (excluding password)
        const userData = {
            id: user.ID,
            email: user.EMAIL,
            name: user.NAME || '',
            lastName: user.LAST_NAME || '',
            fullName: `${user.NAME || ''} ${user.LAST_NAME || ''}`.trim() || user.EMAIL,
            department: user.UF_DEPARTMENT || [],
            employmentDate: user.UF_EMPLOYMENT_DATE || ''
        };

        return Response.json({
            success: true,
            user: userData
        });

    } catch (error) {
        console.error('[Auth] Login error:', error);
        return Response.json({
            success: false,
            error: 'Authentication failed'
        }, { status: 500 });
    }
}
