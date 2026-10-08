import { AppStackParamList } from '@/navigator/app/AppNavigator';
import { TabParamList } from '@/navigator/TabNavigator';
import { theme } from '@/utils/theme';
import { timeAgo } from '@/utils/timeAgo';
import { PunchStatus, PunchTask } from '@/types/punchTask';
import { getAuthState } from '@/store/auth';
import useJobs from '@/hooks/useJobs';
import usePunchTasks from '@/hooks/usePunchTasks';
import { CompositeNavigationProp, NavigationProp, useNavigation } from '@react-navigation/native';
import { AntDesign } from '@react-native-vector-icons/ant-design';
import { FC, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { showErrorToast } from '@/components/ErrorToast';
import StatusBadge, { statusColors, statusLabels } from '@/components/StatusBadge';
import JobSelect from '@/components/JobSelect';
import { useToast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';

type HomeNavigation = CompositeNavigationProp<NavigationProp<AppStackParamList>, NavigationProp<TabParamList>>;

const styles = {
    card: `rounded-2xl border p-4`,
    sectionTitle: `text-lg font-extrabold uppercase tracking-wide`,
    link: `text-sm font-semibold`,
    thumbnail: `h-12 w-12 items-center justify-center rounded-lg`,
    divider: `h-px w-full`,
};

const cardStyle = { backgroundColor: theme.colors.backgroundPrimary, borderColor: theme.colors.border };

const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'zh-Hans', label: '中文 (简体)', flag: '🇨🇳' },
    { code: 'zh-Hant', label: '中文 (繁體)', flag: '🇹🇼' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

const TopBar: FC<{ name: string; subtitle: string; avatar?: string; notifications: number }> = ({ name, subtitle, avatar, notifications }) => {
    const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

    return (
        <View className='flex-row items-center justify-between'>
            <View>
                <View className='flex-row items-baseline'>
                    <Text className='text-3xl font-black italic' style={{ color: theme.colors.textPrimary }}>PUNCH</Text>
                    <Text className='ml-1 text-3xl font-black italic' style={{ color: theme.colors.primary }}>ID</Text>
                </View>
                <Text className='text-[10px] font-bold tracking-[2px]' style={{ color: theme.colors.textSecondary }}>SMART PUNCH LIST TAPE</Text>
            </View>
            <View className='flex-row items-center'>
                <TouchableOpacity className='mr-3'>
                    <AntDesign name='bell' size={22} color={theme.colors.icon} />
                    {notifications > 0 && (
                        <View className='absolute -right-1.5 -top-1.5 h-4 min-w-4 items-center justify-center rounded-full px-1' style={{ backgroundColor: theme.colors.primary }}>
                            <Text className='text-[10px] font-bold' style={{ color: theme.colors.primaryForeground }}>{notifications}</Text>
                        </View>
                    )}
                </TouchableOpacity>
                <View className='h-9 w-9 items-center justify-center overflow-hidden rounded-full border' style={{ backgroundColor: theme.colors.backgroundTertiary, borderColor: theme.colors.border }}>
                    {avatar ? (
                        <Image source={{ uri: avatar }} className='h-full w-full' />
                    ) : (
                        <Text className='text-sm font-bold' style={{ color: theme.colors.textPrimary }}>{initials}</Text>
                    )}
                </View>
            </View>
        </View>
    );
};

const LanguageSelector: FC = () => {
    const [open, setOpen] = useState(false);
    // TODO: wire to i18n once translations exist
    const [selected, setSelected] = useState(LANGUAGES[0]);

    return (
        <View className='mt-5 rounded-2xl border p-3' style={{ backgroundColor: theme.colors.backgroundPrimary, borderColor: theme.colors.primary }}>
            <View className='flex-row items-center'>
                <AntDesign name='global' size={26} color={theme.colors.icon} />
                <Text className='mx-3 flex-1 text-xs font-bold uppercase' style={{ color: theme.colors.textPrimary }} numberOfLines={2}>
                    Select Language / Seleccione el idioma / 选择语言 / 選擇語言 / Langue sélectionner
                </Text>
                <TouchableOpacity className='flex-row items-center rounded-lg px-3 py-2' style={{ backgroundColor: theme.colors.primary }} onPress={() => setOpen(!open)}>
                    <Text className='mr-2 text-xs font-bold uppercase' style={{ color: theme.colors.primaryForeground }}>{selected.label}</Text>
                    <AntDesign name='down' size={12} color={theme.colors.primaryForeground} />
                </TouchableOpacity>
            </View>
            {open && (
                <View className='mt-3 rounded-xl border' style={{ backgroundColor: theme.colors.backgroundTertiary, borderColor: theme.colors.border }}>
                    {LANGUAGES.map((language) => (
                        <TouchableOpacity
                            key={language.code}
                            className='flex-row items-center px-4 py-3'
                            onPress={() => {
                                setSelected(language);
                                setOpen(false);
                            }}
                        >
                            <Text className='mr-3 text-lg'>{language.flag}</Text>
                            <Text className='flex-1 text-base' style={{ color: theme.colors.textPrimary }}>{language.label}</Text>
                            {selected.code === language.code && <AntDesign name='check' size={16} color={theme.colors.primary} />}
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

const QrFrame: FC = () => {
    const corner = 'absolute h-5 w-5';
    const cornerColor = { borderColor: theme.colors.textSecondary };

    return (
        <View className='h-36 w-36 items-center justify-center'>
            <View className={`${corner} left-0 top-0 border-l-2 border-t-2`} style={cornerColor} />
            <View className={`${corner} right-0 top-0 border-r-2 border-t-2`} style={cornerColor} />
            <View className={`${corner} bottom-0 left-0 border-b-2 border-l-2`} style={cornerColor} />
            <View className={`${corner} bottom-0 right-0 border-b-2 border-r-2`} style={cornerColor} />
            <View className='absolute left-3 right-3 top-2 h-0.5 rounded-full' style={{ backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary, shadowOpacity: 1, shadowRadius: 6 }} />
            <View className='rounded-md p-1.5' style={{ backgroundColor: theme.colors.primaryForeground }}>
                <AntDesign name='qrcode' size={92} color={theme.colors.backgroundSecondary} />
            </View>
            <View className='absolute bottom-2 left-3 right-3 h-0.5 rounded-full' style={{ backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary, shadowOpacity: 1, shadowRadius: 6 }} />
        </View>
    );
};

const ScanHero: FC<{ onScan: () => void }> = ({ onScan }) => (
    <View className={`mt-4 ${styles.card}`} style={cardStyle}>
        <View className='flex-row items-center'>
            <View className='flex-1 pr-2'>
                <Text className='text-3xl font-black uppercase' style={{ color: theme.colors.textPrimary }}>Scan Your</Text>
                <Text className='-mt-1 text-5xl font-black uppercase italic' style={{ color: theme.colors.primary }}>QR Code</Text>
            </View>
            <View className='items-center'>
                <QrFrame />
                <Text className='mt-1 text-xs italic' style={{ color: theme.colors.textMuted }}>Scan to get started!</Text>
            </View>
        </View>
        <Text className='mt-3 text-sm leading-5' style={{ color: theme.colors.textSecondary }}>
            Scan any Arrow QR Code on your PUNCH ID tape to view location details, notes, and updates.
        </Text>
        <TouchableOpacity
            className='mt-4 flex-row items-center justify-center rounded-lg py-3.5'
            style={{ backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary, shadowOpacity: 0.5, shadowRadius: 12 }}
            onPress={onScan}
        >
            <AntDesign name='scan' size={20} color={theme.colors.primaryForeground} />
            <Text className='ml-2 text-base font-extrabold uppercase tracking-wide' style={{ color: theme.colors.primaryForeground }}>Scan QR Code</Text>
        </TouchableOpacity>
    </View>
);

const QuickActionCard: FC<{ icon: 'plus-square' | 'file-text' | 'bar-chart' | 'setting'; label: string; onPress: () => void }> = ({ icon, label, onPress }) => (
    <TouchableOpacity className={`mb-3 w-[48.5%] flex-row items-center ${styles.card}`} style={cardStyle} onPress={onPress}>
        <AntDesign name={icon} size={30} color={theme.colors.primary} />
        <Text className='ml-3 flex-1 text-sm font-medium' style={{ color: theme.colors.textPrimary }}>{label}</Text>
    </TouchableOpacity>
);

const SUMMARY_STATUSES: PunchStatus[] = ['Open', 'In progress', 'Complete', 'Late'];

const SummaryDonut: FC<{ summary: Record<PunchStatus, number> }> = ({ summary }) => {
    const size = 120;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const segments = SUMMARY_STATUSES.map((status) => ({
        label: statusLabels[status],
        value: summary[status],
        // open keeps the brand red in the ring, the rest match their status badges
        color: status === 'Open' ? theme.colors.primary : statusColors[status].text,
    }));
    const total = segments.reduce((sum, segment) => sum + segment.value, 0);

    let offset = 0;

    return (
        <View className={`mt-1 ${styles.card}`} style={cardStyle}>
            <Text className={styles.sectionTitle} style={{ color: theme.colors.textPrimary }}>Project Summary</Text>
            <View className='mt-4 flex-row items-center'>
                <View className='items-center justify-center'>
                    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
                        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={theme.colors.backgroundTertiary} strokeWidth={strokeWidth} fill='none' />
                        {total > 0 && segments.map((segment) => {
                            const length = (segment.value / total) * circumference;
                            const dashOffset = -offset;
                            offset += length;
                            return (
                                <Circle
                                    key={segment.label}
                                    cx={size / 2}
                                    cy={size / 2}
                                    r={radius}
                                    stroke={segment.color}
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={`${length} ${circumference - length}`}
                                    strokeDashoffset={dashOffset}
                                    fill='none'
                                />
                            );
                        })}
                    </Svg>
                    <View className='absolute items-center'>
                        <Text className='text-3xl font-black' style={{ color: theme.colors.textPrimary }}>{total}</Text>
                        <Text className='text-xs' style={{ color: theme.colors.textSecondary }}>Total Items</Text>
                    </View>
                </View>
                <View className='ml-5 flex-1'>
                    {segments.map((segment) => (
                        <View key={segment.label} className='my-2 flex-row items-center'>
                            <View className='h-2.5 w-2.5 rounded-sm' style={{ backgroundColor: segment.color }} />
                            <Text className='ml-2 flex-1 text-sm' style={{ color: theme.colors.textPrimary }}>{segment.label}</Text>
                            <Text className='text-sm' style={{ color: theme.colors.textSecondary }}>
                                {segment.value} ({total > 0 ? Math.round((segment.value / total) * 100) : 0}%)
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
};

const ArrowThumbnail: FC = () => (
    <View className={styles.thumbnail} style={{ backgroundColor: theme.colors.backgroundTertiary }}>
        <AntDesign name='arrow-right' size={28} color={theme.colors.primary} />
    </View>
);

const ActivityRow: FC<{ item: PunchTask; jobName: string; owner: string; isLast: boolean }> = ({ item, jobName, owner, isLast }) => (
    <>
        <TouchableOpacity className='flex-row items-center py-3'>
            <ArrowThumbnail />
            <View className='ml-3 flex-1'>
                <Text className='text-base font-semibold' style={{ color: theme.colors.textPrimary }} numberOfLines={1}>{item.name}</Text>
                <Text className='text-xs' style={{ color: theme.colors.textMuted }} numberOfLines={1}>#{item.punchId} · {jobName}</Text>
                <Text className='mt-0.5 text-xs' style={{ color: theme.colors.textSecondary }}>{timeAgo(item.updatedAt)} by {owner}</Text>
            </View>
            <StatusBadge status={item.status} />
            <AntDesign name='right' size={14} color={theme.colors.iconMuted} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
        {!isLast && <View className={styles.divider} style={{ backgroundColor: theme.colors.border }} />}
    </>
);

// TODO: scans aren't tracked yet, so this lists QR codes most recently registered to the job
const ScanRow: FC<{ item: PunchTask; owner: string }> = ({ item, owner }) => (
    <TouchableOpacity className='flex-row items-center py-2.5'>
        <ArrowThumbnail />
        <View className='ml-3 flex-1'>
            <Text className='text-base font-semibold' style={{ color: theme.colors.textPrimary }} numberOfLines={1}>{item.name}</Text>
            <Text className='text-xs' style={{ color: theme.colors.textSecondary }}>Scanned {timeAgo(item.createdAt)}</Text>
            <Text className='text-xs' style={{ color: theme.colors.textMuted }}>By {owner}</Text>
        </View>
    </TouchableOpacity>
);

const EmptyRow: FC<{ message: string }> = ({ message }) => (
    <Text className='py-4 text-center text-sm' style={{ color: theme.colors.textMuted }}>{message}</Text>
);

const TapePromo: FC = () => (
    <View className={`mt-4 flex-row items-center ${styles.card}`} style={cardStyle}>
        <View className='flex-1'>
            <View className='flex-row flex-wrap items-baseline'>
                <Text className='text-lg font-bold' style={{ color: theme.colors.textPrimary }}>Using </Text>
                <Text className='text-lg font-black italic' style={{ color: theme.colors.textPrimary }}>PUNCH</Text>
                <Text className='text-lg font-black italic' style={{ color: theme.colors.primary }}> ID</Text>
                <Text className='text-lg font-bold' style={{ color: theme.colors.textPrimary }}> Tape?</Text>
            </View>
            <Text className='mt-1 text-sm' style={{ color: theme.colors.textSecondary }}>Scan the Arrow QR Code on your tape to get started.</Text>
            <TouchableOpacity className='mt-2 flex-row items-center'>
                <Text className={styles.link} style={{ color: theme.colors.primary }}>Learn more</Text>
                <AntDesign name='arrow-right' size={14} color={theme.colors.primary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
        </View>
        <View className='ml-3 h-20 w-20 items-center justify-center rounded-full border-[6px]' style={{ borderColor: theme.colors.textSecondary, backgroundColor: theme.colors.backgroundTertiary }}>
            <View className='h-8 w-8 rounded-full border-2' style={{ borderColor: theme.colors.textMuted, backgroundColor: theme.colors.backgroundSecondary }} />
            <View className='absolute -right-1 top-2'>
                <AntDesign name='arrow-right' size={18} color={theme.colors.primary} />
            </View>
            <View className='absolute -left-1 bottom-2'>
                <AntDesign name='arrow-right' size={18} color={theme.colors.primary} />
            </View>
        </View>
    </View>
);

const Home: FC = () => {
    const { navigate } = useNavigation<HomeNavigation>();
    const { profile } = useSelector(getAuthState);
    const { jobs, currentJob, fetchJobs } = useJobs();
    const { fetchTasks } = usePunchTasks();
    const [tasks, setTasks] = useState<PunchTask[]>([]);
    const [ready, setReady] = useState(Boolean(jobs));
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const [toastId, setToastId] = useState(0);

    const loadTasks = async (jobId?: string) => {
        if(!jobId) return [];

        const res = await fetchTasks(jobId);
        if(res.error){
            showErrorToast({ description: res.error, toast, toastId, setToastId });
            return null
        }

        return res.tasks;
    };

    const handleRefresh = async () => {
        setLoading(true);
        const { error } = await fetchJobs();
        if(error) showErrorToast({ description: error, toast, toastId, setToastId });
        const result = await loadTasks(currentJob?.id);
        if(result) setTasks(result);
        setLoading(false);
    };

    useEffect(() => {
        fetchJobs().then(({ error }) => {
            if(error) showErrorToast({ description: error, toast, toastId, setToastId });
            setReady(true);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // reload the dashboard whenever a different job site is selected
    useEffect(() => {
        let cancelled = false;
        loadTasks(currentJob?.id).then((result) => {
            if(result && !cancelled) setTasks(result);
        });
        return () => { cancelled = true };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentJob?.id]);

    const summary = useMemo(() => {
        const counts: Record<PunchStatus, number> = { 'Open': 0, 'In progress': 0, 'Complete': 0, 'Late': 0 };
        tasks.forEach((task) => {
            if(task.status in counts) counts[task.status] += 1;
        });
        return counts;
    }, [tasks]);

    // tasks arrive sorted by updatedAt, scans are ordered by when the QR was registered
    const recentActivity = tasks.slice(0, 5);
    const recentScans = useMemo(() => [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3), [tasks]);
    const ownerName = profile?.name ?? '';
    const emptyMessage = currentJob ? 'No punch items for this job site yet.' : 'Select a job site to see its punch items.';

    if(!ready){
        return (
            <View className='flex-1 items-center justify-center' style={{ backgroundColor: theme.colors.backgroundSecondary }}>
                <Spinner size='large' color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View className='flex-1' style={{ backgroundColor: theme.colors.backgroundSecondary }}>
            <ScrollView
                className='px-4'
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor={theme.colors.primary} />}
            >
                {/* TODO: notifications aren't implemented yet, the badge shows once a count is passed */}
                <TopBar name={ownerName} subtitle={profile?.email ?? ''} avatar={profile?.avatar} notifications={0} />
                <View className='mt-4'>
                    <JobSelect allowAdd />
                </View>
                <LanguageSelector />
                <ScanHero onScan={() => navigate('ScanNavigator')} />

                <Text className={`mb-3 mt-6 ${styles.sectionTitle}`} style={{ color: theme.colors.textPrimary }}>Quick Actions</Text>
                <View className='flex-row flex-wrap justify-between'>
                    <QuickActionCard icon='plus-square' label='Add New Punch Item' onPress={() => navigate('AddPunchItem')} />
                    <QuickActionCard icon='file-text' label='View All Punch Items' onPress={() => navigate('PunchNavigator')} />
                    <QuickActionCard icon='bar-chart' label='Reports & Analytics' onPress={() => navigate('ReportsNavigator')} />
                    <QuickActionCard icon='setting' label='Settings & Preferences' onPress={() => navigate('ProfileNavigator')} />
                </View>

                <SummaryDonut summary={summary} />

                <View className='mb-3 mt-6 flex-row items-center justify-between'>
                    <Text className={styles.sectionTitle} style={{ color: theme.colors.textPrimary }}>Recent Activity</Text>
                    <TouchableOpacity onPress={() => navigate('PunchNavigator')}>
                        <Text className={styles.link} style={{ color: theme.colors.primary }}>View All</Text>
                    </TouchableOpacity>
                </View>
                <View className='rounded-2xl border px-4 py-1' style={cardStyle}>
                    {recentActivity.length ? recentActivity.map((item, index) => (
                        <ActivityRow key={item.id} item={item} jobName={currentJob?.name ?? ''} owner={ownerName} isLast={index === recentActivity.length - 1} />
                    )) : <EmptyRow message={emptyMessage} />}
                </View>

                <View className={`mt-6 ${styles.card}`} style={cardStyle}>
                    <Text className={`mb-1 ${styles.sectionTitle}`} style={{ color: theme.colors.textPrimary }}>Recent Scans</Text>
                    {recentScans.length ? recentScans.map((item) => <ScanRow key={item.id} item={item} owner={ownerName} />) : <EmptyRow message={emptyMessage} />}
                    <TouchableOpacity className='mt-2 flex-row items-center' onPress={() => navigate('ScanNavigator')}>
                        <Text className={styles.link} style={{ color: theme.colors.primary }}>View All Scans</Text>
                        <AntDesign name='arrow-right' size={14} color={theme.colors.primary} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                </View>

                <TapePromo />

                <View className='mt-6 items-center'>
                    <Text className='text-xs' style={{ color: theme.colors.textMuted }}>© {new Date().getFullYear()} PUNCH ID. All rights reserved.</Text>
                    <View className='mt-2 flex-row items-center'>
                        <Text className='text-xs' style={{ color: theme.colors.textMuted }}>Privacy Policy</Text>
                        <View className='mx-3 h-3 w-px' style={{ backgroundColor: theme.colors.border }} />
                        <Text className='text-xs' style={{ color: theme.colors.textMuted }}>Terms of Service</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

export default Home;
