import { ComponentType } from "react";
import { Employee, EmployeeStats } from "../types";

// Import SVG icons as React components
import HomeIcon from "../assets/icons/home.svg?react";
import RentIcon from "../assets/icons/rent.svg?react";
import HeartIcon from "../assets/icons/heart.svg?react";
import HeartFilledIcon from "../assets/icons/heart-filled.svg?react";
import UsersIcon from "../assets/icons/users.svg?react";

import LogoutIcon from "../assets/icons/logout.svg?react";
import MenuIcon from "../assets/icons/menu.svg?react";
import GlobalIcon from "../assets/icons/global.svg?react";

import PlusIcon from "../assets/icons/plus.svg?react";
import PlusCircleIcon from "../assets/icons/plus-circle.svg?react";
import PhoneIcon from "../assets/icons/phone.svg?react";
import ListIcon from "../assets/icons/list.svg?react";
import ThumbsUpIcon from "../assets/icons/thumbs-up.svg?react";
import ThumbsDownIcon from "../assets/icons/thumbs-down.svg?react";
import ChartBarIcon from "../assets/icons/chart-bar.svg?react";
import SearchIcon from "../assets/icons/search.svg?react";
import GoogleIcon from "../assets/icons/google.svg?react";
import EditIcon from "../assets/icons/edit.svg?react";
import MoreVerticalIcon from "../assets/icons/dots-vertical.svg?react";
import ExternalLinkIcon from "../assets/icons/external-link.svg?react";
import UploadIcon from "../assets/icons/upload.svg?react";
import MoveIcon from "../assets/icons/move.svg?react";
import DeleteIcon from "../assets/icons/delete.svg?react";
import DownloadIcon from "../assets/icons/download.svg?react";

export interface MenuItem {
  key: string;
  label: string;
  icon: ComponentType<React.SVGProps<SVGSVGElement>>;
  href: string;
  newItems: number;
}

export const MENU_ITEMS: MenuItem[] = [
  {
    key: "ads",
    label: "Объявления",
    icon: HomeIcon,
    href: "/",
    newItems: 0,
  },
  {
    key: "rent",
    label: "Сдается",
    icon: RentIcon,
    href: "/rent",
    newItems: 0,
  },
  {
    key: "favorites",
    label: "Избранное",
    icon: HeartIcon,
    href: "/favorites",
    newItems: 2,
  },
  {
    key: "employees",
    label: "Сотрудники",
    icon: UsersIcon,
    href: "/employees",
    newItems: 0,
  },
  // {
  //   key: "profile",
  //   label: "Профиль",
  //   icon: ProfileIcon,
  //   href: "/profile",
  //   newItems: 0,
  // },
];

export const APP_CONFIG = {
  name: "Объявлятор",
  subscriptionText: "Подписка до 21.07.2025",
  sidebarTitle: "Сотрудники",
  mobileSidebarTitle: "Меню",
};

export const ICONS = {
  logout: LogoutIcon,
  menu: MenuIcon,
  plus: PlusIcon,
  global: GlobalIcon,
  plusCircle: PlusCircleIcon,
  phone: PhoneIcon,
  list: ListIcon,
  thumbsUp: ThumbsUpIcon,
  thumbsDown: ThumbsDownIcon,
  chartBar: ChartBarIcon,
  search: SearchIcon,
  google: GoogleIcon,
  edit: EditIcon,
  rent: RentIcon,
  moreVertical: MoreVerticalIcon,
  externalLink: ExternalLinkIcon,
  heart: HeartIcon,
  heartFilled: HeartFilledIcon,
  upload: UploadIcon,
  move: MoveIcon,
  delete: DeleteIcon,
  download: DownloadIcon
} as const;

// Моковые данные статистики сотрудников
export const MOCK_EMPLOYEE_STATS: Record<string, EmployeeStats> = {
  "1": {
    total_ads: 52,
    not_take: 0,
    not_take_phone: 0,
    our_apartments: 52,
    not_first: 0,
    conversion: 0,
  },
  "2": {
    total_ads: 45,
    not_take: 3,
    not_take_phone: 2,
    our_apartments: 40,
    not_first: 5,
    conversion: 12,
  },
  "3": {
    total_ads: 38,
    not_take: 5,
    not_take_phone: 4,
    our_apartments: 29,
    not_first: 8,
    conversion: 15,
  },
  "4": {
    total_ads: 25,
    not_take: 8,
    not_take_phone: 6,
    our_apartments: 11,
    not_first: 12,
    conversion: 8,
  },
};
