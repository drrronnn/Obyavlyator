import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
} from "@heroui/drawer";
import { useAuthStore } from "../store/authStore";
import { useGeneralStore } from "../store/generalStore";
import Sidebar from "../components/ui/Sidebar";
import { APP_CONFIG, ICONS } from "../config/constants";
import Logo from "@/assets/images/logo.svg?react";
import NiceModal from "@ebay/nice-modal-react";
import { useParserStatus } from "@/shared/hooks/useParserStatus";
interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout для авторизованных пользователей
 * Содержит header с логотипом, информацией о подписке, меню пользователя и сайдбар
 */
const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  // const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isSidebarOpen, setIsSidebarOpen } = useGeneralStore();
  const parserStatus = useParserStatus();

  console.log("Parser Status:", parserStatus);

  const handleLogout = () => {
    // logout();
    // navigate("/auth/login");

    NiceModal.show("logout-confirm-modal");
  };

  return (
    <motion.div
      className="h-screen bg-gray-50 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Fixed Header */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0 z-10">
        <div className="max-w-8xl mx-auto px-6 md:px-8 lg:px-12">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <Logo className="w-8 h-8 rounded-lg flex items-center justify-center" />

              <span className="text-xl font-semibold text-gray-900">
                {APP_CONFIG.name}
              </span>
            </Link>

            {/* Right side - Subscription info and user menu */}
            <div className="flex items-center space-x-6">
              {/* Subscription info */}
              <div className="hidden md:flex items-center space-x-4 text-sm text-gray-400 border-gray-400 border-b-[0.5px]">
                <span>{APP_CONFIG.subscriptionText}</span>
              </div>

              {/* User menu */}
              <div className="flex items-center space-x-3">
                <Dropdown placement="bottom-end">
                  <DropdownTrigger>
                    <button className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer">
                      {user?.first_name?.[0]}
                      {user?.last_name?.[0]}
                    </button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="Profile Actions" variant="flat">
                    <DropdownItem key="profile" href="/profile">
                      Профиль
                    </DropdownItem>
                    <DropdownItem key="subscription">Подписка</DropdownItem>
                    <DropdownItem key="help_and_feedback">
                      Помощь и обратная связь
                    </DropdownItem>
                    <DropdownItem
                      key="logout"
                      color="danger"
                      onClick={handleLogout}
                    >
                      Выйти
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>

                <span className="hidden sm:block text-sm text-gray-700">
                  {user?.first_name} {user?.last_name}
                </span>

                <div className="hidden lg:flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="flat"
                    className={`w-8 h-8 min-w-8 p-0 rounded-full ${parserStatus.status === 'running'
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : 'bg-red-500 hover:bg-red-600'
                      }`}
                  >
                    <ICONS.global
                      className="w-4 h-4"
                      fill="transparent"
                      stroke="white"
                      strokeWidth={1.5}
                    />
                  </Button>

                  <Button
                    size="sm"
                    variant="bordered"
                    className="w-8 h-8 min-w-8 p-0 rounded-full border-green-500 bg-green-500 text-white"
                  >
                    <ICONS.phone
                      className="w-4 h-4"
                      fill="transparent"
                      stroke="white"
                      strokeWidth={1.5}
                    />
                  </Button>
                </div>

                {/* Burger menu button - visible only on mobile, moved to the right */}
                <Button
                  size="sm"
                  variant="faded"
                  className="lg:hidden w-8 h-8 min-w-8 p-0"
                  onPress={() => setIsSidebarOpen(true)}
                >
                  <ICONS.menu className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar - fixed and always visible on lg+ screens */}
        <Sidebar className="hidden lg:flex w-64 flex-shrink-0" />

        {/* Mobile Sidebar Drawer */}
        <Drawer
          backdrop="blur"
          isOpen={isSidebarOpen}
          size="sm"
          onClose={() => setIsSidebarOpen(false)}
          className="lg:hidden"
          placement="left"
        >
          <DrawerContent>
            {(onClose) => (
              <>
                <DrawerHeader className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-blue-600">
                    {APP_CONFIG.mobileSidebarTitle}
                  </h2>
                </DrawerHeader>
                <DrawerBody className="p-0">
                  <Sidebar onItemClick={onClose} />
                </DrawerBody>
              </>
            )}
          </DrawerContent>
        </Drawer>

        {/* Scrollable Main Content */}
        <motion.div
          className="flex-1 overflow-y-auto max-w-7xl mx-auto px-6 py-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {children}
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-8xl mx-auto px-6 md:px-8 lg:px-12">
          <div className="flex flex-col sm:flex-row justify-between items-center h-auto sm:h-12 py-3 sm:py-0 text-xs sm:text-sm md:text-base text-gray-500">
            <div className="mb-2 sm:mb-0 text-sm">
              © 2025 Все права защищены
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-8 text-center sm:text-left">
              <Link
                to="/terms"
                className="hover:text-gray-700 transition-colors text-sm"
              >
                Условия использования
              </Link>
              <Link
                to="/privacy"
                className="hover:text-gray-700 transition-colors text-sm"
              >
                Политика конфиденциальности
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </motion.div>
  );
};

export default DashboardLayout;
