/**
 * ImageRow component
 * Displays a single image row in the image list
 */

import React from 'react';
import type { Image } from '../../types/image';
import { formatImageSize, getImageName, isDanglingImage } from '../../types/image';
import { formatDistanceToNow } from 'date-fns';

interface ImageRowProps {
  image: Image;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function ImageRow({ image, isSelected, onSelect }: ImageRowProps) {
  const handleCheckboxChange = () => {
    onSelect(image.id);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const isDangling = isDanglingImage(image);

  return (
    <div
      className={`
        grid grid-cols-[48px_200px_150px_120px_1fr] gap-4 px-4 py-4
        border-b border-gray-200 dark:border-gray-700
        hover:bg-gray-50 dark:hover:bg-gray-800
        transition-colors duration-150
        ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
      `}
    >
      {/* Checkbox */}
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleCheckboxChange}
          onClick={handleCheckboxClick}
          className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
          aria-label={`Select image ${getImageName(image)}`}
        />
      </div>

      {/* Repository */}
      <div className="flex items-center">
        <span
          className={`text-sm font-medium truncate ${
            isDangling
              ? 'text-gray-400 dark:text-gray-500 italic'
              : 'text-gray-900 dark:text-gray-100'
          }`}
          title={image.repository}
        >
          {image.repository}
        </span>
      </div>

      {/* Tag */}
      <div className="flex items-center">
        <span
          className={`text-sm truncate ${
            isDangling
              ? 'text-gray-400 dark:text-gray-500 italic'
              : 'text-gray-700 dark:text-gray-300'
          }`}
          title={image.tag}
        >
          {image.tag}
        </span>
      </div>

      {/* Size */}
      <div className="flex items-center">
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {formatImageSize(image.size)}
        </span>
      </div>

      {/* Created */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400" title={image.created}>
          {formatDistanceToNow(new Date(image.created), { addSuffix: true })}
        </span>
        {image.containers > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {image.containers} container{image.containers !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}
