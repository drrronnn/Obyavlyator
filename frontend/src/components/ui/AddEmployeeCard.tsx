import React from "react";
import { Button } from "@heroui/button";
import { ICONS } from "../../config/constants";

interface AddEmployeeCardProps {
  onAddEmployee: () => void;
}

/**
 * Карточка для добавления нового сотрудника
 */
const AddEmployeeCard: React.FC<AddEmployeeCardProps> = ({ onAddEmployee }) => {
  return (
    <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-6 hover:border-gray-400 transition-colors">
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] h-full">
        <Button
          variant="light"
          size="lg"
          onPress={onAddEmployee}
          className="flex flex-col items-center space-y-2 text-gray-500 hover:text-gray-700 h-full"
        >
          <div className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center mb-2">
            <ICONS.plusCircle className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium">Добавить пользователя</span>
        </Button>
      </div>
    </div>
  );
};

export default AddEmployeeCard;
