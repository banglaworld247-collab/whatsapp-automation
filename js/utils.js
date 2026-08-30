/**
 * TSBD (Tuition Service BD) - Utility Functions
 */

// Escape HTML for XSS prevention
export function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Convert English numbers to Bengali numerals
export function toBnDigits(number) {
    if (number === null || number === undefined) return '';
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(number).replace(/[0-9]/g, digit => bnDigits[digit]);
}

// Convert Bengali numerals to English
export function toEnDigits(str) {
    if (!str) return '';
    const enDigits = { '০':'0', '১':'1', '২':'2', '৩':'3', '৪':'4', '৫':'5', '৬':'6', '৭':'7', '৮':'8', '৯':'9' };
    return String(str).replace(/[০-৯]/g, d => enDigits[d]);
}

// Format currency
export function formatSalary(amount) {
    if (!amount) return 'আলোচনা সাপেক্ষে';
    const num = parseInt(toEnDigits(amount), 10);
    if (isNaN(num)) return amount;
    return `৳ ${toBnDigits(num.toLocaleString('en-IN'))}/-`;
}

// Format relative date or standard date
export function formatDate(timestamp, showTime = false) {
    if (!timestamp) return 'অজানা সময়';
    
    let date;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else if (typeof timestamp === 'number' || typeof timestamp === 'string') {
        date = new Date(timestamp);
    } else {
        return 'অজানা সময়';
    }

    if (isNaN(date.getTime())) return 'অজানা সময়';

    const day = date.getDate();
    const months = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    let formatted = `${toBnDigits(day)} ${month}, ${toBnDigits(year)}`;

    if (showTime) {
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'পিএম' : 'এএম';
        hours = hours % 12 || 12;
        formatted += ` (${toBnDigits(hours)}:${toBnDigits(String(minutes).padStart(2, '0'))} ${ampm})`;
    }

    return formatted;
}

// Normalize phone number for Bangladesh (e.g. 017... -> +88017...)
export function normalizePhone(rawPhone) {
    if (!rawPhone) return '';
    let digits = toEnDigits(rawPhone).replace(/[^0-9]/g, '');
    if (digits.startsWith('880')) {
        return '+' + digits;
    }
    if (digits.startsWith('01')) {
        return '+88' + digits;
    }
    return digits;
}

/**
 * Client-Side Image Compressor
 * Resizes large camera photos and compresses them to lightweight WebP/JPEG format before uploading
 * @param {File} file 
 * @param {Object} options { maxWidth: 1200, maxHeight: 1200, quality: 0.8 }
 * @returns {Promise<File>} Compressed File object
 */
export async function compressImage(file, options = {}) {
    if (!file || !file.type.startsWith('image/')) {
        return file; // Return as-is if PDF or non-image
    }

    const { maxWidth = 1280, maxHeight = 1280, quality = 0.8 } = options;

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let { width, height } = img;

                if (width > maxWidth || height > maxHeight) {
                    if (width > height) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Use WebP if supported, fallback to JPEG
                const mimeType = 'image/webp';
                canvas.toBlob((blob) => {
                    if (!blob) {
                        resolve(file);
                        return;
                    }
                    const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                    const compressedFile = new File([blob], newFileName, {
                        type: mimeType,
                        lastModified: Date.now()
                    });
                    console.log(`📸 Image compressed: ${(file.size / 1024).toFixed(1)}KB -> ${(compressedFile.size / 1024).toFixed(1)}KB`);
                    resolve(compressedFile);
                }, mimeType, quality);
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
}

/**
 * Toast Notification Popup Helper
 */
export function showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('tsbdToastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'tsbdToastContainer';
        container.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const colors = {
        success: { bg: '#10B981', icon: 'fa-circle-check' },
        error: { bg: '#EF4444', icon: 'fa-circle-xmark' },
        warning: { bg: '#F59E0B', icon: 'fa-triangle-exclamation' },
        info: { bg: '#3B82F6', icon: 'fa-circle-info' }
    };
    const c = colors[type] || colors.info;

    toast.style.cssText = `
        background: #1E293B;
        color: #F8FAFC;
        border-left: 4px solid ${c.bg};
        padding: 12px 18px;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: 'Noto Sans Bengali', sans-serif;
        font-size: 14px;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: auto;
        max-width: 360px;
    `;
    toast.innerHTML = `<i class="fa-solid ${c.icon}" style="color:${c.bg};font-size:18px;"></i> <span>${message}</span>`;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 350);
    }, duration);
}

/**
 * Check if a gender / preference string represents Female
 * Handles English ('female', 'woman') and Bengali ('মহিলা', 'মেয়ে', 'নারী', 'মহিলা শিক্ষিকা')
 */
export function isFemaleGender(genderStr) {
    if (!genderStr) return false;
    const s = String(genderStr).toLowerCase().trim();
    return s === 'female' || s === 'মহিলা' || s === 'মহিলা শিক্ষিকা' || s === 'মেয়ে' || s === 'নারী' ||
           s.includes('female') || s.includes('মহিলা') || s.includes('মেয়ে') || s.includes('নারী');
}

/**
 * Check if a gender / preference string represents Male
 * Handles English ('male', 'man') and Bengali ('পুরুষ', 'ছেলে', 'পুরুষ শিক্ষক')
 */
export function isMaleGender(genderStr) {
    if (!genderStr) return false;
    const s = String(genderStr).toLowerCase().trim();
    return s === 'male' || s === 'পুরুষ' || s === 'পুরুষ শিক্ষক' || s === 'ছেলে' ||
           s.includes('male') || s.includes('পুরুষ') || s.includes('ছেলে');
}

/**
 * Strict Gender Matching Validation for Tuition Applications:
 * Ensures male tutors cannot apply for female-preferred tuition,
 * and female tutors cannot apply for male-preferred tuition.
 *
 * @param {string} tutorGender - The applicant tutor's gender ('মহিলা', 'পুরুষ', 'female', 'male', etc.)
 * @param {string} preferredTutor - The tuition requirement ('Female', 'Male', 'Any', 'মহিলা', 'পুরুষ', etc.)
 * @returns {{ allowed: boolean, message: string }}
 */
export function validateGenderMatch(tutorGender, preferredTutor) {
    const isPrefFemale = isFemaleGender(preferredTutor);
    const isPrefMale = isMaleGender(preferredTutor);

    // If preferred tutor is 'Any' or not specified, anyone can apply
    if (!isPrefFemale && !isPrefMale) {
        return { allowed: true, message: "" };
    }

    const isTutorFemale = isFemaleGender(tutorGender);
    const isTutorMale = isMaleGender(tutorGender);

    if (isPrefFemale && isTutorMale) {
        return {
            allowed: false,
            message: "দুঃখিত! এই টিউশনের জন্য শুধুমাত্র মহিলা শিক্ষিকা আবেদন করতে পারবেন (Male tutor cannot apply for female preferred tuition)।"
        };
    }

    if (isPrefMale && isTutorFemale) {
        return {
            allowed: false,
            message: "দুঃখিত! এই টিউশনের জন্য শুধুমাত্র পুরুষ শিক্ষক আবেদন করতে পারবেন (Female tutor cannot apply for male preferred tuition)।"
        };
    }

    return { allowed: true, message: "" };
}

