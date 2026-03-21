import { useWindowDimensions } from 'react-native';

import { ExamplesPage } from '../docs/pages';
import { RouterPage } from '../docs/router-page';

export default function ExamplesRoute() {
  const { width } = useWindowDimensions();

  return (
    <RouterPage>
      <ExamplesPage width={width} />
    </RouterPage>
  );
}
