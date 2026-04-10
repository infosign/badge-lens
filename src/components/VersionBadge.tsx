import type { BadgeVersion } from '../types/badges'

interface Props {
  version: BadgeVersion
}

export function VersionBadge({ version }: Props) {
  if (version === 'v2.0') {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
        v2.0
      </span>
    )
  }
  if (version === 'v3.0') {
    return (
      <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-800">
        v3.0
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
      unknown
    </span>
  )
}
