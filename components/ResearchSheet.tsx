import { BottomSheet, Button } from 'heroui-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { View } from 'react-native';
import type { ReactNode } from 'react';
export function ResearchSheet({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <BottomSheet
      isOpen={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          snapPoints={['80%']}
          enableDynamicSizing={false}
          contentContainerClassName="h-full"
        >
          <BottomSheet.Title className="mb-4">{title}</BottomSheet.Title>
          <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            {children}
          </BottomSheetScrollView>
          <View style={{ paddingVertical: 12 }}>
            <Button variant="secondary" onPress={onClose}>
              <Button.Label>Done</Button.Label>
            </Button>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
