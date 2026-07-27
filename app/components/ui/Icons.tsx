"use client";

import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{children}</svg>;
}

export const ChevronDownIcon = (props: IconProps) => <Icon {...props}><path d="m7 10 5 5 5-5" /></Icon>;
export const CheckIcon = (props: IconProps) => <Icon {...props}><path d="m5 12 4 4L19 6" /></Icon>;
export const SearchIcon = (props: IconProps) => <Icon {...props}><circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 4 4" /></Icon>;
export const FolderIcon = (props: IconProps) => <Icon {...props}><path d="M3 7.5h7l2-2h9v13H3z" /></Icon>;
export const ExportIcon = (props: IconProps) => <Icon {...props}><path d="M12 3v12M7 8l5-5 5 5" /><path d="M5 14v6h14v-6" /></Icon>;
export const ActivityIcon = (props: IconProps) => <Icon {...props}><path d="M3 12h4l2-6 4 12 2-6h6" /></Icon>;
export const SunIcon = (props: IconProps) => <Icon {...props}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Icon>;
export const MoonIcon = (props: IconProps) => <Icon {...props}><path d="M20 15.5A8 8 0 0 1 8.5 4 8 8 0 1 0 20 15.5Z" /></Icon>;
export const InfoIcon = (props: IconProps) => <Icon {...props}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></Icon>;
export const MoreIcon = (props: IconProps) => <Icon {...props}><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></Icon>;
export const DownloadIcon = (props: IconProps) => <Icon {...props}><path d="M12 3v12M7 10l5 5 5-5" /><path d="M5 20h14" /></Icon>;
export const CopyIcon = (props: IconProps) => <Icon {...props}><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></Icon>;
export const UploadIcon = (props: IconProps) => <Icon {...props}><path d="M12 16V4M7 9l5-5 5 5" /><path d="M5 20h14" /></Icon>;
export const ArrowRightIcon = (props: IconProps) => <Icon {...props}><path d="M5 12h14M14 7l5 5-5 5" /></Icon>;
export const PaletteIcon = (props: IconProps) => <Icon {...props}><path d="M12 3a9 9 0 0 0 0 18h1.5a1.5 1.5 0 0 0 0-3H12a2 2 0 0 1 0-4h3a6 6 0 0 0 0-12Z" /><circle cx="7.5" cy="10" r=".75" fill="currentColor" stroke="none" /><circle cx="10" cy="6.8" r=".75" fill="currentColor" stroke="none" /></Icon>;
export const GridIcon = (props: IconProps) => <Icon {...props}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></Icon>;
export const SlidersIcon = (props: IconProps) => <Icon {...props}><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></Icon>;
export const FlaskIcon = (props: IconProps) => <Icon {...props}><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3" /><path d="M7.5 15h9" /></Icon>;
