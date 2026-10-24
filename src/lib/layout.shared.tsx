import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared"
import { Mark } from "@/components/mark"
import { appName, githubUrl } from "./shared"

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="group/mark inline-flex items-center gap-2 font-medium">
          <Mark className="size-5" />
          {appName}
        </span>
      ),
    },
    githubUrl,
    themeSwitch: { enabled: false },
  }
}
