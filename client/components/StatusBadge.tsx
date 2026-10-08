import React, { FC } from 'react';
import { View, Text } from 'react-native';
import { theme } from '@/utils/theme';
import { PunchStatus } from '@/types/punchTask';

export const statusColors: Record<PunchStatus, { text: string; background: string }> = {
    'Open': { text: theme.colors.error, background: theme.colors.errorMuted },
    'In progress': { text: theme.colors.warning, background: theme.colors.warningMuted },
    'Complete': { text: theme.colors.success, background: theme.colors.successMuted },
    'Late': { text: theme.colors.late, background: theme.colors.lateMuted },
};

// server status values -> labels shown in the UI
export const statusLabels: Record<PunchStatus, string> = {
    'Open': 'Open',
    'In progress': 'In Progress',
    'Complete': 'Completed',
    'Late': 'Late',
};

interface Props {
    status: PunchStatus;
}

const StatusBadge: FC<Props> = ({ status }) => {
    const colors = statusColors[status] ?? statusColors.Open;

    return (
        <View className='rounded-md px-2.5 py-1' style={{ backgroundColor: colors.background }}>
            <Text className='text-xs font-semibold' style={{ color: colors.text }}>{statusLabels[status] ?? status}</Text>
        </View>
    );
};

export default StatusBadge;
