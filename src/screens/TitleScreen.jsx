import TitleScreenV1 from './TitleScreenV1.jsx';
import TitleScreenV2 from './TitleScreenV2.jsx';

// Current entry is ver2. Use ?title=ver1 to revisit the original screen.
export default function TitleScreen(props) {
  const version = new URLSearchParams(window.location.search).get('title');
  return version === 'ver1' ? <TitleScreenV1 {...props} /> : <TitleScreenV2 {...props} />;
}
