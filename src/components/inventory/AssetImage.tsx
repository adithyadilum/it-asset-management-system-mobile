import { useState } from 'react';
import { Image, View } from 'react-native';
import { Package } from 'lucide-react-native';
import { Colors } from '../../constants/colors';

export function AssetImage({
  uri,
  large = false,
}: {
  uri: string | null;
  large?: boolean;
}) {
  return <ImageContent key={uri} uri={uri} large={large} />;
}
function ImageContent({ uri, large }: { uri: string | null; large: boolean }) {
  const [failed, setFailed] = useState(false);
  const size = large ? 180 : 60;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: large ? 20 : 12,
        backgroundColor: Colors.backgroundSubtle,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {uri && !failed ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          resizeMode="contain"
          resizeMethod={large ? 'auto' : 'resize'}
          onError={() => setFailed(true)}
          accessibilityLabel="Asset image"
        />
      ) : (
        <Package size={large ? 56 : 24} color={Colors.mutedForeground} />
      )}
    </View>
  );
}
