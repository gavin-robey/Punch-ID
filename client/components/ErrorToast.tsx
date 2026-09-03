import { Dispatch, SetStateAction } from 'react';
import { AlertCircleIcon, Icon } from './ui/icon';
import { HStack } from './ui/hstack';
import { Toast, ToastDescription, useToast } from './ui/toast';

type ToastApi = ReturnType<typeof useToast>;

type ShowErrorToast = {
  description: string;
  toast: ToastApi;
  toastId: number;
  setToastId: Dispatch<SetStateAction<number>>;
};

export const showErrorToast = ({description, toast,toastId, setToastId}: ShowErrorToast) => {
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
        action="error"
        variant="outline"
        nativeID={`toast-${id}`}
        className="w-screen max-w-none flex-row justify-between gap-6 border-red-400 bg-black p-4 shadow-hard-5 md:w-full md:max-w-110.75"
      >
        <HStack space="md">
          <Icon as={AlertCircleIcon} className="mt-0.5 stroke-red-400" />
          <ToastDescription size="lg">{description}</ToastDescription>
        </HStack>
      </Toast>
    ),
  });
};
