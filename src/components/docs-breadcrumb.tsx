import { Link } from "@tanstack/react-router"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
} from "@/components/ui/breadcrumb"

export function DocsBreadcrumb() {
  return (
    // Lines up with the sidebar items, which carry their own inline padding.
    <Breadcrumb className="md:px-2">
      <BreadcrumbList>
        <BreadcrumbItem>
          <Link to="/" className="link-text">
            Home
          </Link>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
