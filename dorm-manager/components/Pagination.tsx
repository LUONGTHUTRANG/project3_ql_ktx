import React from 'react';
import { Select } from 'antd';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (items: number) => void;
  itemsPerPageOptions?: number[];
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [5, 10, 20, 50]
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Logic to determine which page numbers/ellipses to show
  const getPages = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= 4) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // If totalPages > 4
    if (currentPage <= 2) {
      // Near the beginning: 1 2 3 ... n
      return [1, 2, 3, '...', totalPages];
    } else if (currentPage >= totalPages - 1) {
      // Near the end: 1 ... n-2 n-1 n
      return [1, '...', totalPages - 2, totalPages - 1, totalPages];
    } else {
      // In the middle: 1 ... current ... n
      return [1, '...', currentPage, '...', totalPages];
    }
  };

  const visiblePages = getPages();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border-color dark:border-gray-700 pt-6 pb-8 mt-2 px-4 md:px-6">
      <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary dark:text-gray-400">
        <p>
          Hiển thị <span className="font-bold text-text-main dark:text-white">{totalItems > 0 ? startItem : 0}-{endItem}</span> trong số <span className="font-bold text-text-main dark:text-white">{totalItems}</span> mục
        </p>
        
        {onItemsPerPageChange && (
          <div className="flex items-center gap-2 border-l border-border-color dark:border-gray-700 pl-4 ml-2">
            <span className="hidden sm:inline">Số dòng:</span>
            <Select 
              className="w-20"
              value={itemsPerPage}
              onChange={(val) => onItemsPerPageChange(val)}
              options={itemsPerPageOptions.map(option => ({
                value: option,
                label: option.toString()
              }))}
              suffixIcon={<span className="material-symbols-outlined text-[16px] text-text-secondary">expand_more</span>}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-9 px-3 rounded-lg border border-border-color dark:border-gray-700 text-text-main dark:text-white text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">chevron_left</span>
          <span className="hidden sm:inline">Trước</span>
        </button>
        
        <div className="flex items-center gap-1 px-1">
          {visiblePages.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="w-9 h-9 flex items-center justify-center text-text-secondary dark:text-gray-500 font-medium">
                  ...
                </span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  className={`h-9 w-9 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${
                    currentPage === page 
                      ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105' 
                      : 'text-text-main dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        <button 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="h-9 px-3 rounded-lg border border-border-color dark:border-gray-700 text-text-main dark:text-white text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
        >
          <span className="hidden sm:inline">Sau</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
        </button>
      </div>
    </div>
  );
};

export default Pagination;