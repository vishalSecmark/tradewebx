
import React, { useState } from 'react';
import { FaMinus, FaPlus } from 'react-icons/fa';
import { useTheme } from '@/context/ThemeContext';

interface MultiEntryDataTablesProps {
    data: any[];
}

const MultiEntryDataTables: React.FC<MultiEntryDataTablesProps> = ({ data }) => {
    const { colors, fonts } = useTheme();

    if (!data || data.length === 0) {
        return <div className="p-4 text-center">No nested data available.</div>;
    }

    return (
        <div style={{ fontFamily: fonts.content }} className="space-y-4">
            <CustomRecursiveTable data={data} colors={colors} fonts={fonts} />
        </div>
    );
};

const CustomRecursiveTable = ({ data, level = 0, colors, fonts }: { data: any[]; level?: number; colors: any; fonts: any }) => {
    if (!data || data.length === 0) return null;

    // Detect structure from the first item
    const sampleItem = data[0];
    const keys = Object.keys(sampleItem);

    // Separate primitive values (columns) from arrays (nested tables)
    const primitiveKeys = keys.filter(key => 
        (!Array.isArray(sampleItem[key]) && typeof sampleItem[key] !== 'object' || sampleItem[key] === null) &&
        key !== '_id'
    );
    const arrayKeys = keys.filter(key => Array.isArray(sampleItem[key]));

    return (
        <div className={`overflow-x-auto ${level > 0 ? 'border-l-2 border-blue-200 pl-2 mt-2' : 'border rounded-lg shadow-sm'}`}>
            <table className="min-w-full divide-y divide-gray-200">
                <thead style={{ 
                    backgroundColor: colors.primary,
                    color: colors.buttonText
                }}>
                    <tr>
                        {arrayKeys.length > 0 && <th className="px-4 py-2 w-10"></th>} 
                        {primitiveKeys.map(key => (
                            <th 
                                key={key} 
                                className="px-2 py-1 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                                style={{ color: colors.buttonText }}
                            >
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((row, index) => (
                        <ExpandableRow 
                            key={index} 
                            row={row} 
                            primitiveKeys={primitiveKeys} 
                            arrayKeys={arrayKeys} 
                            level={level}
                            colors={colors}
                            fonts={fonts}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const ExpandableRow = ({ row, primitiveKeys, arrayKeys, level, colors, fonts }: any) => {
    const [isExpanded, setIsExpanded] = useState(true); 

    const toggleExpand = () => setIsExpanded(!isExpanded);

    return (
        <>
            <tr className={`hover:bg-gray-50 transition-colors ${level % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                {arrayKeys.length > 0 && (
                     <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-500 w-8 text-center cursor-pointer" onClick={toggleExpand}>
                         {isExpanded ? <FaMinus size={10} /> : <FaPlus size={10} />}
                    </td>
                )}
                {primitiveKeys.map((key: string) => (
                    <td key={key} className="px-2 py-1 whitespace-nowrap text-xs text-gray-700">
                        {row[key]}
                    </td>
                ))}
            </tr>
            {isExpanded && arrayKeys.length > 0 && (
                <tr>
                    <td colSpan={primitiveKeys.length + (arrayKeys.length > 0 ? 1 : 0)} className="p-2 bg-gray-50">
                        {arrayKeys.map((arrayKey: string) => (
                            row[arrayKey] && row[arrayKey].length > 0 && (
                                <div key={arrayKey} className="mb-2 last:mb-0">
                                    <div className="mb-2 text-xs font-semibold text-gray-500 uppercase">
                                        {arrayKey.replace(/([A-Z])/g, ' $1').trim()}
                                    </div>
                                    <CustomRecursiveTable data={row[arrayKey]} level={level + 1} colors={colors} fonts={fonts} />
                                </div>
                            )
                        ))}
                    </td>
                </tr>
            )}
        </>
    );
};

export default MultiEntryDataTables;
