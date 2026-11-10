const MORNING_MESSAGES = [
  "🌅 காலை வணக்கம்! இன்றைய ஒவ்வொரு முயற்சியும் உங்கள் வெற்றியை நோக்கி ஒரு புதிய படியாக அமையட்டும். வெற்றிகரமான நாளாக அமையட்டும்! 🚀👑",
  "🌞 இன்றைய நாள் வெற்றிகரமான நாளாக அமையட்டும்!",
  "🚀 உங்கள் நாள் வெற்றியும் முன்னேற்றமும் நிறைந்ததாக அமையட்டும்!",
  "💪 இன்று நீங்கள் எடுக்கும் ஒவ்வொரு அடியும் வெற்றியை நோக்கி அமையட்டும்!",
  "🌟 வெற்றியும் நம்பிக்கையும் நிறைந்த இனிய நாளாக அமையட்டும்!",
  "👑 இன்றைய முயற்சி நாளைய வெற்றியாக மலரட்டும். வெற்றிகரமான நாளாக அமையட்டும்!",
  "🔥 உங்கள் இலக்குகளை நோக்கி தன்னம்பிக்கையுடன் முன்னேறுங்கள். வெற்றிகரமான நாளாக அமையட்டும்!",
  "✨ ஒவ்வொரு முயற்சியும் வெற்றியை நெருங்கட்டும். இனிய வெற்றிகரமான நாளாக அமையட்டும்!",
  "🎯 வெற்றியை நோக்கிய உங்கள் பயணம் இன்று மேலும் ஒரு படி முன்னேறட்டும்."
];

export function checkAndGetMorningGreeting() {
  const todayStr = new Date().toDateString(); // e.g., "Wed Aug 05 2026"
  const lastShownDate = localStorage.getItem('growth_os_last_greeting_date');
  
  // If already shown today, return null
  if (lastShownDate === todayStr) {
    return null; 
  }

  // Pick a random message for today
  const randomMsg = MORNING_MESSAGES[Math.floor(Math.random() * MORNING_MESSAGES.length)];
  
  // Save today's date so it won't pop up again today
  localStorage.setItem('growth_os_last_greeting_date', todayStr);
  
  return randomMsg;
}