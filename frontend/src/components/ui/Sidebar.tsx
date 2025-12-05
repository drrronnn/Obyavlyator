import React, { useCallback, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { MENU_ITEMS, ICONS } from "../../config/constants";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import NiceModal from "@ebay/nice-modal-react";
import { useNewFavoritesStore } from "@/store/newFavoritesStore";

interface SidebarProps {
  className?: string;
  onItemClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ className = "", onItemClick }) => {
  const location = useLocation();
  const { count } = useNewFavoritesStore();

  const menuItemsWithBadge = useMemo(() => 
    MENU_ITEMS.map(item => 
      item.key === 'favorites' 
        ? { ...item, newItems: count > 0 ? count : undefined }
        : item
    ), [count]
  );

  console.log(count , 'count')

  const handleLogout = useCallback(() => {
    NiceModal.show("logout-confirm-modal");
  }, []);
  return (
    <div
      className={`bg-[#EEEEEE] border-r border-gray-200 flex flex-col h-full ${className}`}
    >
      <div className="p-3 flex-1 overflow-y-auto">
        <nav className="space-y-1">
          {menuItemsWithBadge.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.key}
                to={item.href}
                className={`group flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ease-in-out w-full ${
                  isActive 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-gray-600 hover:text-[var(--color-blue-700)] hover:bg-gray-50 hover:[svg]:stroke-current"
                }`}
                onClick={onItemClick}
              >
                <Badge
                  hidden={!item.newItems}
                  color="primary"
                  content={item.newItems || false}
                >
                  <item.icon
                    className="w-5 h-5 transition-all duration-300 ease-in-out"
                    fill={isActive ? "black" : "transparent"}
                    stroke={isActive ? "black" : "currentColor"}
                  />
                </Badge>
                <span className="transition-all duration-300 ease-in-out">{item.label}</span>
              </Link>
            );
          })}
          <div className="lg:hidden mt-4">
            <Button
              onPress={handleLogout}
              variant="bordered"
              color="danger"
              fullWidth
              className="justify-start"
            >
              <ICONS.logout className="w-5 h-5" />
              <span>Выйти</span>
            </Button>
          </div>
        </nav>
      </div>

      {/* Logout button at the bottom on desktop */}
      <div className="hidden lg:block p-3 border-t border-gray-200">
        <Button
          onPress={handleLogout}
          variant="bordered"
          color="danger"
          fullWidth
          className="justify-start"
        >
          <ICONS.logout className="w-5 h-5" />
          <span>Выйти</span>
        </Button>
      </div>

      {/* Mobile action buttons - only visible on mobile */}
      <div className="lg:hidden p-3 flex-shrink-0">
        <div className="flex items-center justify-center space-x-4">
          <Button
            size="sm"
            variant="bordered"
            className="w-10 h-10 min-w-10 p-0 rounded-full border-red-500 bg-red-500"
          >
            <ICONS.plus
              className="w-5 h-5"
              fill="transparent"
              stroke="white"
              strokeWidth={1.5}
            />
          </Button>

          <Button
            size="sm"
            variant="bordered"
            className="w-10 h-10 min-w-10 p-0 rounded-full border-green-500 bg-green-500"
          >
            <ICONS.phone
              className="w-5 h-5"
              fill="transparent"
              stroke="white"
              strokeWidth={1.5}
            />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
