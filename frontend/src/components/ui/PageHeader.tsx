import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  children,
}) => {
  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex !flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-0">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 break-words">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm sm:text-base text-gray-600 break-words">
              {subtitle}
            </p>
          )}
        </div>
        {children && (
          <div className="w-full flex items-center space-x-2 flex-shrink-0 self-start sm:self-auto">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
