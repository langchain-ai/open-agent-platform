import { DemoBanner } from "./demo";

/**
 * A header component that can be used to display a header with a sidebar trigger and a breadcrumb.
 */
function Header({ children }: React.PropsWithChildren) {
    return (
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <DemoBanner />
            <div className="flex items-center gap-2 px-4">
                {children}
            </div>
        </header>
    )
}

export { Header };