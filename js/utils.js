/**
 * TSBD (Tuition Service BD) - Central Utility & Dataset Module
 */

// Comprehensive Bangladesh Location Dataset
export const BD_LOCATIONS = {
    "ঢাকা": {
        "ঢাকা": ["ধানমন্ডি", "মিরপুর", "উত্তরা", "গুলশান", "বনানী", "মোহাম্মদপুর", "মতিঝিল", "বাড্ডা", "মালিবাগ", "যাত্রাবাড়ী", "লালমাটিয়া", "খিলগাঁও", "বসুন্ধরা আ/এ", "ক্যান্টনমেন্ট", "তেজগাঁও", "পল্টন", "কাফরুল", "শান্তিনগর", "শ্যামলী", "মোহাম্মদপুর", "বংশাল", "ওয়ারী", "যাত্রাবাড়ী", "কেরানীগঞ্জ", "সাভার"],
        "গাজীপুর": ["গাজীপুর সদর", "টঙ্গী", "কালিয়াকৈর", "শ্রীপুর", "কাপাসিয়া"],
        "নারায়ণগঞ্জ": ["নারায়ণগঞ্জ সদর", "সিদ্ধিরগঞ্জ", "ফতুল্লা", "সোনারগাঁও", "রূপগঞ্জ", "আড়াইহাজার"],
        "টাঙ্গাইল": ["টাঙ্গাইল সদর", "মির্জাপুর", "মধুপুর", "কালিহাতী", "সখিপুর", "ঘাটাইল"],
        "নরসিংদী": ["নরসিংদী সদর", "পলাশ", "শিবপুর", "বেলাব", "রায়পুরা", "মনোহরদী"],
        "মুন্সীগঞ্জ": ["মুন্সীগঞ্জ সদর", "শ্রীনগর", "সিরাজদিখান", "গজারিয়া", "লৌহজং", "টঙ্গীবাড়ী"],
        "মানিকগঞ্জ": ["মানিকগঞ্জ সদর", "সিংগাইর", "সাটুরিয়া", "শিবালয়", "ঘিওর"],
        "কিশোরগঞ্জ": ["কিশোরগঞ্জ সদর", "ভৈরব", "বাজিতপুর", "করিমগঞ্জ", "কটিয়াদী"],
        "ফরিদপুর": ["ফরিদপুর সদর", "বোয়ালমারী", "ভাঙ্গা", "মধুখালী", "নগরকান্দা"],
        "গোপালগঞ্জ": ["গোপালগঞ্জ সদর", "কাটালীপাড়া", "কাশিয়ানী", "টুঙ্গিপাড়া", "মুকসুদপুর"],
        "মাদারীপুর": ["মাদারীপুর সদর", "শিবচর", "কালকিনি", "রাজৈর"],
        "শরীয়তপুর": ["শরীয়তপুর সদর", "জাজিরা", "নড়িয়া", "ডামুড্যা", "গোসাইরহাট"],
        "রাজবাড়ী": ["রাজবাড়ী সদর", "পাংশা", "বালিয়াকান্দি", "গোয়ালন্দ", "কালুখালী"]
    },
    "চট্টগ্রাম": {
        "চট্টগ্রাম": ["চট্টগ্রাম সদর", "পাঁচলাইশ", "খুলশী", "হালিশহর", "আগ্রাবাদ", "চান্দগাঁও", "কোতোয়ালী", "পাহাড়তলী", "বাকলিয়া", "পতেঙ্গা", "হাটহাজারী", "রাউজান", "সীতাকুণ্ড", "মিরসরাই", "পটিয়া"],
        "কুমিল্লা": ["কুমিল্লা সদর", "সদর দক্ষিণ", "দাউদকান্দি", "চান্দিনা", "লাকসাম", "দেবীদ্বার", "বুড়িচং", "চৌদ্দগ্রাম", "ব্রাহ্মণপাড়া"],
        "কক্সবাজার": ["কক্সবাজার সদর", "রামু", "উখিয়া", "টেকনাফ", "চকরিয়া", "মহেশখালী"],
        "ব্রাহ্মণবাড়িয়া": ["ব্রাহ্মণবাড়িয়া সদর", "আশুগঞ্জ", "নবীনগর", "সরাইল", "কসবা", "বাঞ্ছারামপুর"],
        "নোয়াখালী": ["নোয়াখালী সদর", "বেগমগঞ্জ", "চাটখিল", "কোম্পানীগঞ্জ", "সেনবাগ", "সোনাইমুড়ী"],
        "ফেনী": ["ফেনী সদর", "দাগনভূঞা", "সোনাগাজী", "ছাগলনাইয়া", "পরশুরাম", "ফুলগাজী"],
        "চাঁদপুর": ["চাঁদপুর সদর", "হাজীগঞ্জ", "মতলব উত্তর", "মতলব দক্ষিণ", "ফরিদগঞ্জ", "শাহরাস্তি"]
    },
    "রাজশাহী": {
        "রাজশাহী": ["বোয়ালিয়া", "মতিহার", "রাজপাড়া", "শাহ মখদুম", "কাটাখালী", "পবা", "গোদাগাড়ী", "বাগমারা", "পুঠিয়া"],
        "বগুড়া": ["বগুড়া সদর", "শাজাহানপুর", "শেরপুর", "শিবগঞ্জ", "গাবতলী", "দুপচাঁচিয়া", "কাহালু"],
        "পাবনা": ["পাবনা সদর", "ঈশ্বরদী", "সাঁথিয়া", "সুজানগর", "বেড়া", "চাটমোহর", "ফরিদপুর"],
        "সিরাজগঞ্জ": ["সিরাজগঞ্জ সদর", "বেলকুচি", "শাহজাদপুর", "উল্লাপাড়া", "কামারখন্দ", "রায়গঞ্জ"]
    },
    "খুলনা": {
        "খুলনা": ["সোনাডাঙ্গা", "খালিশপুর", "দৌলতপুর", "খান জাহান আলী", "খুলনা সদর", "রূপসা", "ডুমুরিয়া"],
        "যশোর": ["যশোর সদর", "ঝিকরগাছা", "অভয়নগর", "মণিরামপুর", "কেশবপুর", "বাঘারপাড়া"],
        "কুষ্টিয়া": ["কুষ্টিয়া সদর", "কুমারখালী", "মিরপুর", "ভেড়ামারা", "খোকসা", "দৌলতপুর"]
    },
    "সিলেট": {
        "সিলেট": ["সিলেট সদর", "দক্ষিণ সুরমা", "কোতোয়ালী", "শাহপরাণ", "গোলাপগঞ্জ", "বিয়ানীবাজার", "বিশ্বনাথ"],
        "মৌলভীবাজার": ["মৌলভীবাজার সদর", "শ্রীমঙ্গল", "কমলগঞ্জ", "কুলাউড়া", "বড়লেখা"],
        "হবিগঞ্জ": ["হবিগঞ্জ সদর", "নবীগঞ্জ", "বাহুবল", "মাধবপুর", "চুনারুঘাট"],
        "সুনামগঞ্জ": ["সুনামগঞ্জ সদর", "ছাতক", "জগন্নাথপুর", "দিরাই", "তাহিরপুর"]
    },
    "বরিশাল": {
        "বরিশাল": ["বরিশাল সদর", "কোতোয়ালী", "বিমানবন্দর", "বাকেরগঞ্জ", "বাবুগঞ্জ", "উজিরপুর", "গৌরনদী"],
        "পটুয়াখালী": ["পটুয়াখালী সদর", "বাউফল", "গলাচিপা", "কলাপাড়া", "দশমিনা"]
    },
    "রংপুর": {
        "রংপুর": ["রংপুর সদর", "কোতোয়ালী", "পীরগঞ্জ", "বদরগঞ্জ", "মিঠাপুকুর", "কাউনিয়া", "গঙ্গাচড়া"],
        "দিনাজপুর": ["দিনাজপুর সদর", "বীরগঞ্জ", "চিরিরবন্দর", "ফুলবাড়ী", "পার্বতীপুর", "বিরামপুর"]
    },
    "ময়মনসিংহ": {
        "ময়মনসিংহ": ["ময়মনসিংহ সদর", "মুক্তাগাছা", "ত্রিশাল", "ভালুকা", "গফরগাঁও", "ফুলবাড়িয়া", "ঈশ্বরগঞ্জ"],
        "জামালপুর": ["জামালপুর সদর", "সরিষাবাড়ী", "মেলান্দহ", "ইসলামপুর", "বকশীগঞ্জ", "দেওয়ানগঞ্জ"]
    }
};

// Medium Options
export const MEDIUM_OPTIONS = [
    "Bangla Medium (বাংলা মাধ্যম)",
    "English Version (ইংলিশ ভার্সন)",
    "English Medium - Cambridge / Edexcel",
    "Madrasah Medium (মাদ্রাসা মাধ্যম)",
    "Admission Test (বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি)",
    "Medical Admission (মেডিকেল ভর্তি প্রস্তুতি)",
    "Engineering Admission (বুয়েট/প্রকৌশল ভর্তি)",
    "Spoken English / IELTS",
    "Quran / Arabic Learning (কুরআন শিক্ষা)",
    "Computer Programming / Coding"
];

// Classes / Grades
export const CLASS_OPTIONS = [
    "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
    "Class 6", "Class 7", "Class 8 (JSC)", "Class 9 (SSC)", "Class 10 (SSC)",
    "HSC 1st Year", "HSC 2nd Year", "A Level", "O Level",
    "University Level", "Language / Professional"
];

// Top Bangladesh Universities for filtering
export const TOP_UNIVERSITIES = [
    "Bangladesh University of Engineering and Technology (BUET)",
    "University of Dhaka (DU)",
    "Dhaka Medical College (DMC) / Medical",
    "Institute of Business Administration (IBA, DU)",
    "Jahangirnagar University (JU)",
    "Rajshahi University (RU)",
    "Chittagong University (CU)",
    "Shahjalal University of Science & Technology (SUST)",
    "Khulna University of Engineering & Technology (KUET)",
    "Chittagong University of Engineering & Technology (CUET)",
    "Rajshahi University of Engineering & Technology (RUET)",
    "Bangladesh Agricultural University (BAU)",
    "Islamic University of Technology (IUT)",
    "North South University (NSU)",
    "BRAC University (BRACU)",
    "Ahsanullah University of Science and Technology (AUST)",
    "East West University (EWU)",
    "Independent University, Bangladesh (IUB)",
    "United International University (UIU)",
    "National University (NU)"
];

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

// Time ago calculation in Bengali
export function timeAgo(timestamp) {
    if (!timestamp) return 'কিছুক্ষণ আগে';
    let date;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else if (typeof timestamp === 'number' || typeof timestamp === 'string') {
        date = new Date(timestamp);
    } else {
        return 'কিছুক্ষণ আগে';
    }

    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'এইমাত্র';
    if (diffSec < 3600) return `${toBnDigits(Math.floor(diffSec / 60))} মিনিট আগে`;
    if (diffSec < 86400) return `${toBnDigits(Math.floor(diffSec / 3600))} ঘণ্টা আগে`;
    if (diffSec < 2592000) return `${toBnDigits(Math.floor(diffSec / 86400))} দিন আগে`;
    return formatDate(date);
}

// Normalize phone number for Bangladesh
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

// Client-Side Image Compressor
export async function compressImage(file, options = {}) {
    if (!file || !file.type.startsWith('image/')) {
        return file;
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
                    resolve(compressedFile);
                }, mimeType, quality);
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
}

// Toast Notification Popup Helper
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
        max-width: 380px;
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

// Gender Matching Utilities
export function isFemaleGender(genderStr) {
    if (!genderStr) return false;
    const s = String(genderStr).toLowerCase().trim();
    if (s === 'any' || s === 'both' || s === 'উভয়' || s === 'সকল' || s === 'all' || s === 'না') return false;
    return s === 'female' || s === 'মহিলা' || s === 'মহিলা শিক্ষিকা' || s === 'মেয়ে' || s === 'মেয়ে' || s === 'নারী' ||
           s.includes('female') || s.includes('মহিলা') || s.includes('মেয়ে') || s.includes('মেয়ে') || s.includes('নারী');
}

export function isMaleGender(genderStr) {
    if (!genderStr) return false;
    const s = String(genderStr).toLowerCase().trim();
    if (s === 'any' || s === 'both' || s === 'উভয়' || s === 'সকল' || s === 'all' || s === 'না') return false;
    // CRITICAL FIX: "female".includes("male") evaluates to true because "male" is a substring of "female".
    // Therefore, any female string must be excluded first, and we use regex word boundary /\bmale\b/ for English.
    if (isFemaleGender(s)) return false;
    return s === 'male' || s === 'পুরুষ' || s === 'পুরুষ শিক্ষক' || s === 'ছেলে' ||
           /\bmale\b/i.test(s) || s.includes('পুরুষ') || s.includes('ছেলে');
}

export function validateGenderMatch(tutorGender, preferredTutor) {
    if (!tutorGender || !preferredTutor) {
        return { allowed: true, message: "" };
    }

    const isPrefFemale = isFemaleGender(preferredTutor);
    const isPrefMale = isMaleGender(preferredTutor);

    // If preferred tutor requirement is Any or unspecific, any tutor can apply
    if (!isPrefFemale && !isPrefMale) {
        return { allowed: true, message: "" };
    }

    const isTutorFemale = isFemaleGender(tutorGender);
    const isTutorMale = isMaleGender(tutorGender);

    // If tuition specifically requires a Female tutor
    if (isPrefFemale && !isPrefMale) {
        if (isTutorMale && !isTutorFemale) {
            return {
                allowed: false,
                message: "দুঃখিত! এই টিউশনের জন্য শুধুমাত্র মহিলা শিক্ষিকা আবেদন করতে পারবেন।"
            };
        }
        return { allowed: true, message: "" };
    }

    // If tuition specifically requires a Male tutor
    if (isPrefMale && !isPrefFemale) {
        if (isTutorFemale && !isTutorMale) {
            return {
                allowed: false,
                message: "দুঃখিত! এই টিউশনের জন্য শুধুমাত্র পুরুষ শিক্ষক আবেদন করতে পারবেন।"
            };
        }
        return { allowed: true, message: "" };
    }

    return { allowed: true, message: "" };
}

export function formatGenderDisplay(genderStr) {
    if (!genderStr) return 'N/A';
    const s = String(genderStr).trim();
    if (isFemaleGender(s) && !isMaleGender(s)) return 'Female';
    if (isMaleGender(s) && !isFemaleGender(s)) return 'Male';
    const lower = s.toLowerCase();
    if (lower === 'any' || lower === 'both' || s === 'উভয়' || lower === 'all') return 'Any';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// Helper to populate Division, District and Thana selects
export function initLocationDropdowns(divSelectId, distSelectId, thanaSelectId) {
    const divSelect = document.getElementById(divSelectId);
    const distSelect = document.getElementById(distSelectId);
    const thanaSelect = document.getElementById(thanaSelectId);

    if (!divSelect || !distSelect || !thanaSelect) return;

    // Populate Divisions
    divSelect.innerHTML = '<option value="">সকল বিভাগ</option>';
    Object.keys(BD_LOCATIONS).forEach(div => {
        divSelect.innerHTML += `<option value="${div}">${div}</option>`;
    });

    distSelect.innerHTML = '<option value="">সকল জেলা</option>';
    thanaSelect.innerHTML = '<option value="">সকল থানা / এলাকা</option>';

    divSelect.addEventListener('change', () => {
        const selectedDiv = divSelect.value;
        distSelect.innerHTML = '<option value="">সকল জেলা</option>';
        thanaSelect.innerHTML = '<option value="">সকল থানা / এলাকা</option>';

        if (selectedDiv && BD_LOCATIONS[selectedDiv]) {
            Object.keys(BD_LOCATIONS[selectedDiv]).forEach(dist => {
                distSelect.innerHTML += `<option value="${dist}">${dist}</option>`;
            });
        }
    });

    distSelect.addEventListener('change', () => {
        const selectedDiv = divSelect.value;
        const selectedDist = distSelect.value;
        thanaSelect.innerHTML = '<option value="">সকল থানা / এলাকা</option>';

        if (selectedDiv && selectedDist && BD_LOCATIONS[selectedDiv] && BD_LOCATIONS[selectedDiv][selectedDist]) {
            BD_LOCATIONS[selectedDiv][selectedDist].forEach(thana => {
                thanaSelect.innerHTML += `<option value="${thana}">${thana}</option>`;
            });
        }
    });
}
