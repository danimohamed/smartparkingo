/**
 * Auth routes bring their own shell: `sign-in` uses SignInMarketingLayout;
 * `sign-up`, `forgot-password`, and `reset-password` use Side (see each route’s layout.jsx).
 */
const Layout = ({ children }) => {
    return <div className="flex min-h-[100dvh] flex-auto flex-col">{children}</div>
}

export default Layout
