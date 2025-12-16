
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
        <div 
            className={`overflow-x-auto ${level > 0 ? 'mt-2' : 'rounded-lg shadow-sm'}`}
            style={{
                border: `1px solid ${colors.textInputBorder}`,
                marginLeft: level > 0 ? '8px' : '0' // Indent nested tables slightly
            }}
        >
            <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
                <thead style={{ 
                    backgroundColor: colors.primary,
                    color: colors.buttonText,
                    borderBottom: `1px solid ${colors.textInputBorder}` 
                }}>
                    <tr>
                        {arrayKeys.length > 0 && (
                            <th 
                                className="px-4 py-2 w-10"
                                style={{ borderRight: `1px solid ${colors.textInputBorder}` }}
                            ></th>
                        )} 
                        {primitiveKeys.map((key, index) => (
                            <th 
                                key={key} 
                                className="px-2 py-1 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                                style={{ 
                                    color: colors.buttonText,
                                    borderRight: index === primitiveKeys.length - 1 ? 'none' : `1px solid ${colors.textInputBorder}` 
                                }}
                            >
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody style={{ backgroundColor: colors.background }}>
                    {data.map((row, index) => (
                        <ExpandableRow 
                            key={index}
                            index={index} 
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

const ExpandableRow = ({ row, primitiveKeys, arrayKeys, level, colors, fonts, index }: any) => {
    const [isExpanded, setIsExpanded] = useState(true); 
    const [isHovered, setIsHovered] = useState(false);

    const toggleExpand = () => setIsExpanded(!isExpanded);

    const rowStyle = {
        backgroundColor: isHovered 
            ? colors.color1 
            : (index % 2 === 0 ? colors.evenCardBackground : colors.oddCardBackground),
        color: colors.text,
        cursor: 'default',
        transition: 'background-color 0.2s ease'
    };

    return (
        <>
            <tr 
                style={rowStyle}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {arrayKeys.length > 0 && (
                     <td 
                        className="px-2 py-1 whitespace-nowrap text-xs w-8 text-center cursor-pointer" 
                        onClick={toggleExpand}
                        style={{ 
                            color: colors.text,
                            borderRight: `1px solid ${colors.textInputBorder}`,
                            borderBottom: `1px solid ${colors.textInputBorder}`
                        }}
                     >
                         {isExpanded ? <FaMinus size={10} /> : <FaPlus size={10} />}
                    </td>
                )}
                {primitiveKeys.map((key: string, colIndex: number) => (
                    <td 
                        key={key} 
                        className="px-2 py-1 whitespace-nowrap text-xs"
                        style={{ 
                            color: colors.text,
                            borderRight: colIndex === primitiveKeys.length - 1 ? 'none' : `1px solid ${colors.textInputBorder}`,
                            borderBottom: `1px solid ${colors.textInputBorder}`
                        }}
                    >
                        {row[key]}
                    </td>
                ))}
            </tr>
            {isExpanded && arrayKeys.length > 0 && (
                <tr style={{ backgroundColor: colors.background }}>
                    <td 
                        colSpan={primitiveKeys.length + (arrayKeys.length > 0 ? 1 : 0)} 
                        className="p-2"
                        style={{
                            borderBottom: `1px solid ${colors.textInputBorder}`
                        }}
                    >
                        {arrayKeys.map((arrayKey: string) => (
                            row[arrayKey] && row[arrayKey].length > 0 && (
                                <div key={arrayKey} className="mb-2 last:mb-0">
                                    <div className="mb-2 text-xs font-semibold uppercase" style={{ color: colors.text }}>
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
