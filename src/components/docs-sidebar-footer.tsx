import { FileTextIcon, PackageIcon } from "lucide-react"

import { GitHubIcon } from "@/components/github-icon"
import { Separator } from "@/components/ui/separator"
import { githubUrl, registryUrl } from "@/lib/shared"

const AUTHOR_URL = "https://alexandrejoly.me"

const LINKS = [
  { label: "GitHub", href: githubUrl, icon: GitHubIcon, external: true },
  {
    label: "Registry",
    href: `${registryUrl}/registry.json`,
    icon: PackageIcon,
    external: true,
  },
  { label: "llms.txt", href: "/llms.txt", icon: FileTextIcon, external: false },
]

export function DocsSidebarFooter() {
  return (
    <div className="flex flex-col text-sm">
      <ul className="flex flex-col">
        {LINKS.map(({ label, href, icon: Icon, external }) => (
          <li key={label}>
            <a
              href={href}
              {...(external && {
                target: "_blank",
                rel: "noopener noreferrer",
              })}
              className="flex items-center gap-3 rounded-md px-2 py-2 text-muted-foreground transition-colors duration-150 ease-out outline-none focus-visible:ring-3 focus-visible:ring-ring/50 can-hover:hover:bg-accent can-hover:hover:text-foreground"
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </a>
          </li>
        ))}
      </ul>
      <Separator className="my-3" />
      <p className="px-2 leading-relaxed text-muted-foreground">
        Made by{" "}
        <a
          href={AUTHOR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="link-text"
        >
          Alexandre Joly
        </a>
      </p>
    </div>
  )
}
