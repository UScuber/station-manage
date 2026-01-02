// TabNavigation(選択中のタブを表示するコンポーネント)

import { Box, Tab, Tabs } from "@mui/material";
import { ReactElement, useState } from "react";

export type TabPanelProps = {
  children?: React.ReactNode;
  padding?: number;
  label: string;
  disabled?: boolean;
};

// 親がTabPanelPropsの情報を使って表示を制御する
export const TabPanel = ({ children }: TabPanelProps) => {
  return children;
};

export const TabNavigation = ({
  children,
}: {
  children: ReactElement<TabPanelProps>[];
}) => {
  const childProps = children.map((child) => child.props);

  const [tabValue, setTabValue] = useState(() => {
    let next_val = 0;
    while (next_val < children.length && childProps[next_val].disabled) {
      next_val++;
    }
    return next_val;
  });

  return (
    <Box sx={{ minHeight: 600 }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
        >
          {children.map((child, idx) => (
            <Tab
              key={idx}
              label={child.props.label}
              disabled={child.props.disabled}
            />
          ))}
        </Tabs>
      </Box>
      {/* Tab内の要素 */}
      {children.map((child, idx) => (
        <div
          role="tabpanel"
          hidden={tabValue !== idx}
          id={`tabpanel-${idx}`}
          aria-labelledby={`tab-${idx}`}
          key={idx}
        >
          {tabValue === idx && !child.props.disabled && (
            <Box sx={{ p: child.props.padding ?? 2 }}>{child}</Box>
          )}
        </div>
      ))}
    </Box>
  );
};
