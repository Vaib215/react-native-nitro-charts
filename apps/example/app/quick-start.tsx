import { useWindowDimensions } from 'react-native';

import { QuickStartPage } from '../docs/pages';
import { RouterPage } from '../docs/router-page';

export default function QuickStartRoute() {
  const { width } = useWindowDimensions();

  return (
    <RouterPage>
      <QuickStartPage width={width} />
    </RouterPage>
  );
}
