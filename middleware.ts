import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith('/api/stripe/webhook')) {
        return NextResponse.next({ request });
    }

    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Session yenile
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    const isProtectedRoute =
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/tasks') ||
        pathname.startsWith('/prompts') ||
        pathname.startsWith('/tools') ||
        pathname.startsWith('/costs');

    // Dashboard route'larını koru
    if (isProtectedRoute) {
        if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }

        const { data: workspace } = await supabase
            .from('workspaces')
            .select('id')
            .eq('owner_id', user.id)
            .limit(1)
            .single();

        if (!workspace) {
            const url = request.nextUrl.clone();
            url.pathname = '/onboarding';
            url.searchParams.set('step', '1');
            return NextResponse.redirect(url);
        }
    }

    if (pathname.startsWith('/onboarding')) {
        if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }

        const { data: workspace } = await supabase
            .from('workspaces')
            .select('id')
            .eq('owner_id', user.id)
            .limit(1)
            .single();

        if (workspace) {
            const url = request.nextUrl.clone();
            url.pathname = '/dashboard';
            return NextResponse.redirect(url);
        }
    }

    // Giriş yapmış kullanıcıyı login/signup'tan yönlendir
    if (user && (pathname === '/login' || pathname === '/signup')) {
        const url = request.nextUrl.clone();

        // Eğer workspace'i yoksa onboarding'e at, varsa dashboard'a at
        const { data: workspace } = await supabase
            .from('workspaces')
            .select('id')
            .eq('owner_id', user.id)
            .limit(1)
            .single();

        if (!workspace) {
            url.pathname = '/onboarding';
            url.searchParams.set('step', '1');
        } else {
            url.pathname = '/dashboard';
        }

        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
