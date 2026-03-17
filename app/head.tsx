export default function Head() {
  const embed = {
    version: '1',
    imageUrl: 'https://tachi-quest.vercel.app/og-image.png',
    button: {
      title: 'Start Quest',
      action: {
        type: 'launch_frame',
        name: 'TACHI Quest',
        url: 'https://tachi-quest.vercel.app',
        splashImageUrl: 'https://tachi-quest.vercel.app/splash.png',
        splashBackgroundColor: '#0a0a0f',
      },
    },
  };

  const content = JSON.stringify(embed);

  return (
    <>
      <meta name="fc:miniapp" content={content} />
      {/* Backward compatibility for legacy clients */}
      <meta name="fc:frame" content={content} />
    </>
  );
}
