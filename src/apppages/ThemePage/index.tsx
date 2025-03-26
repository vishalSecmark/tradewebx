"use client";
import { ThemeType } from '@/context/ThemeContext';
import { useTheme } from '@/context/ThemeContext';
import React from 'react';


const ThemePage = () => {
    const { theme, setTheme, availableThemes, colors } = useTheme();

    return (
        <div style={{
            background: colors?.background || '#f0f0f0',
            color: colors?.text || '#000',
            minHeight: '100vh',
            padding: '20px'
        }}>
            <h1 style={{ marginBottom: '20px' }}>Theme Settings</h1>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            }}>
                {availableThemes.map((themeOption: ThemeType) => (
                    <button
                        key={themeOption}
                        onClick={() => setTheme(themeOption)}
                        style={{
                            padding: '15px',
                            border: `2px solid ${themeOption === theme ? colors.primary : colors.textInputBorder}`,
                            borderRadius: '8px',
                            background: colors.cardBackground,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px',
                            width: '100%',
                            textAlign: 'left'
                        }}
                    >
                        <div style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            background: themeOption === 'dark' ? '#334155' :
                                themeOption === 'light' ? '#d2e7ff' :
                                    themeOption === 'lightDark' ? '#242424' : '#E3F2FD'
                        }} />
                        <span style={{
                            color: colors.text,
                            textTransform: 'capitalize',
                            flex: 1
                        }}>
                            {themeOption}
                        </span>
                        {themeOption === theme && (
                            <span style={{ color: colors.primary }}>
                                ✓ Current Theme
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ThemePage;
