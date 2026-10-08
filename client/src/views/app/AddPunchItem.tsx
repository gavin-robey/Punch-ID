import { theme } from '@/utils/theme';
import { FC, useState, useEffect } from 'react';
import { ScrollView, View, Text} from 'react-native';
import { Input, InputField } from '@/components/ui/input';
import { runAxiosAsync } from '@/api/runAxiosAsync';
import asyncStorage, { Keys } from '@/utils/asyncStorage';
import useClient from '@/hooks/useClient';
import { getJobsState, updateJobState } from '@/store/jobs';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronDownIcon } from '@/components/ui/icon';
import { Select, SelectTrigger, SelectPortal, SelectContent, SelectItem, SelectDragIndicator, SelectDragIndicatorWrapper, SelectIcon, SelectInput, SelectBackdrop} from '@/components/ui/select';
import { ButtonGroup, Button, ButtonText, ButtonSpinner, ButtonIcon } from '@/components/ui/button';

const AddPunchItem: FC = () => {
    const [code, setCode] = useState("");
    const {authClient} = useClient();
    const [loading, setLoading] = useState(false);
    const {jobs, pending} = useSelector(getJobsState);
    const dispatch = useDispatch()

    useEffect(() => {
        const loadJobs = async () => {
            if (!jobs) dispatch(updateJobState({ pending: true, jobs }));

            // make jobs in asyncStorage
            const accessToken = await asyncStorage.get(Keys.AUTH_TOKEN);
            const res = await runAxiosAsync(
                authClient.get('job/get-jobs', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                })
            );

            const responseData = Array.isArray(res?.data) ? res.data : res?.data?.jobs ?? [];
            const mappedJobs = responseData.map((job: any) => ({
                id: job._id ?? job.id as string,
                name: job.name as string,
                owner: job.owner as string,
                punchTasks: Array.isArray(job.punchTasks) ? job.punchTasks : [],
                createdAt: job.createdAt as string,
                updatedAt: job.updatedAt as string,
            }));

            dispatch(updateJobState({ pending: false, jobs: mappedJobs as any }));
        };

        loadJobs();

    }, [authClient, dispatch]);

    return (
        <View className="flex-1 p-3" style={{ backgroundColor: theme.colors.backgroundSecondary, minHeight: '100%' }}>
            <View>
                <Text style={{ color: theme.colors.textPrimary }} className='text-2xl font-bold'>ADD PUNCH ITEM</Text>
                <Text style={{color: theme.colors.textSecondary}} className='mt-2'>Upload content that will be linked to an Arrow QR code.</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }} className='mt-10'>
                <View className='rounded-2xl border border-[#2f2f2f] p-3'>
                    
                    {jobs ? (
                        <>
                            <Text className='text-white font-bold'>1. SELECT JOB SITE</Text>
                            <Select className='mb-3 mt-3'>
                                <SelectTrigger className="border-gray-600" variant="outline" size="md">
                                    <SelectInput  placeholder={"FIKCKF jhdsf"}  className="placeholder:text-white text-white w-[92%]"/>
                                    <SelectIcon className="text-white" as={ChevronDownIcon} />
                                </SelectTrigger>
                                <SelectPortal >
                                    <SelectBackdrop />
                                    <SelectContent >
                                        <SelectDragIndicatorWrapper>
                                            <SelectDragIndicator />
                                        </SelectDragIndicatorWrapper>
                                        {jobs?.map((job) => (
                                            <SelectItem key={job.id ?? job.name} label={job.name} value={job.name} />
                                        ))}
                                        <Button className="mt-5 mb-10 w-full" variant="secondary" size="lg">
                                            <ButtonText>Button</ButtonText>
                                        </Button>
                                    </SelectContent>
                                </SelectPortal>
                            </Select>
                        </>
                    ) : (
                        <>
                            <Text className='text-white font-bold'>1. CREATE JOB SITE</Text>
                            <Button className="mt-3 mb-3" variant="secondary" size="lg">
                                <ButtonText>Button</ButtonText>
                            </Button>
                        </>
                    )}
                    <View className='h-px w-full mb-3' style={{ backgroundColor: '#2f2f2f' }} />
                    
                    <Text className='text-white font-bold'>2. CONNECT QR</Text>
                    <Text style={{color: theme.colors.textSecondary}} className='text-sm mt-2 mb-2'>Scan the Arrow QR Code you want to attach content to</Text>

                    <Input className='mt-2 rounded-xl border border-[#2f2f2f] bg-transparent'>
                        <InputField
                            placeholder="Input Arrow QR code (For now)"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={code}
                            onChangeText={(text) => setCode(text)}
                            style={{ color: theme.colors.textPrimary }}
                        />
                    </Input>

                    <View className='h-px w-full mb-3' style={{ backgroundColor: '#2f2f2f' }} />

                    <Text className='text-white font-bold'>3. ADD NOTES</Text>
                    <Text style={{color: theme.colors.textSecondary}} className='text-sm mt-2 mb-2'>Add important task notes below.</Text>
                </View>
            </ScrollView>
        </View>
    );
};

export default AddPunchItem;
