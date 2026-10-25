import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared"
import { DocsBreadcrumb } from "@/components/docs-breadcrumb"

export function baseOptions(): BaseLayoutProps {
  return {
    // A function title replaces the default link to "/", which would nest
    // the breadcrumb's own links inside it.
    nav: { title: () => <DocsBreadcrumb /> },
    themeSwitch: { enabled: false },
    searchToggle: { enabled: false },
  }
}
