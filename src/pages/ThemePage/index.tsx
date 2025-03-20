"use client";
import { ThemeType } from '@/context/ThemeContext';
import { useTheme } from '@/context/ThemeContext';
import React from 'react';


const ThemePage = () => {
    const { theme, setTheme, availableThemes, colors } = useTheme();

    return (
        <div style={{
            background: colors.background,
            color: colors.text,
            minHeight: '100vh',
            padding: '20px'
        }}>
            <h1 style={{ marginBottom: '20px' }}>Theme Settings</h1>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px'
            }}>
                {availableThemes.map((themeOption: ThemeType) => (
                    <button
                        key={themeOption}
                        onClick={() => setTheme(themeOption)}
                        style={{
                            padding: '20px',
                            border: `2px solid ${themeOption === theme ? colors.primary : colors.textInputBorder}`,
                            borderRadius: '8px',
                            background: colors.cardBackground,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '10px'
                        }}
                    >
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            background: themeOption === 'dark' ? '#334155' :
                                themeOption === 'light' ? '#d2e7ff' :
                                    themeOption === 'lightDark' ? '#242424' : '#E3F2FD'
                        }} />
                        <span style={{
                            color: colors.text,
                            textTransform: 'capitalize'
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
