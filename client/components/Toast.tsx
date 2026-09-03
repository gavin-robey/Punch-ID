import { Dispatch, SetStateAction } from 'react';
import { CheckIcon, Icon } from './ui/icon';
import { HStack } from './ui/hstack';
import { Toast, ToastDescription, useToast } from './ui/toast';

type ToastApi = ReturnType<typeof useToast>;

type ShowToast = {
  description: string;
  toast: ToastApi;
  toastId: number;
  setToastId: Dispatch<SetStateAction<number>>;
};

export const showToast = ({description, toast,toastId, setToastId}: ShowToast) => {
  if (toast.isActive(toastId)) {
    return;
  }

  const newId = Math.random();
  setToastId(newId);

  toast.show({
    id: newId,
    placement: 'top',
    duration: 3000,
    render: ({ id }) => (
      <Toast
        action="success"
        variant="outline"
        nativeID={`toast-${id}`}
        className="w-screen max-w-none flex-row justify-between gap-6 border-green-300 bg-black p-4 shadow-hard-5 md:w-full md:max-w-110.75"
      >
        <HStack space="md">
          <Icon as={CheckIcon} className="mt-0.5 stroke-green-300" />
          <ToastDescription size="lg">{description}</ToastDescription>
        </HStack>
      </Toast>
    ),
  });
};
