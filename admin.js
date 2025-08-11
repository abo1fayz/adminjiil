// admin.js - النسخة الكاملة المصححة
const GITHUB_API_URL = "https://api.github.com/repos/abo1fayz/jiil/contents/data.json";
const DATA_URL = "https://raw.githubusercontent.com/abo1fayz/jiil/main/data.json";
let currentData = { students: [] };

document.addEventListener('DOMContentLoaded', () => {
    setupTestTypeListener();
});

function setupTestTypeListener() {
    document.getElementById('testType').addEventListener('change', function() {
        updateTestFields(this.value);
    });
    updateTestFields('quranTests');
}

function updateTestFields(testType) {
    const testFields = document.getElementById('testFields');
    let fieldsHTML = '';

    if (testType === 'quranTests') {
        fieldsHTML = `
            <div class="form-row">
                <div class="input-group">
                    <label for="testPart">الجزء:</label>
                    <input type="text" id="testPart" required>
                </div>
                <div class="input-group">
                    <label for="testMemorization">الحفظ (%):</label>
                    <input type="number" id="testMemorization" min="0" max="100" required>
                </div>
                <div class="input-group">
                    <label for="testRecitation">التلاوة (%):</label>
                    <input type="number" id="testRecitation" min="0" max="100" required>
                </div>
            </div>
        `;
    } else if (testType === 'tajweedTests') {
        fieldsHTML = `
            <div class="input-group">
                <label for="testName">اسم اختبار التجويد:</label>
                <input type="text" id="testName" required>
            </div>
            <div class="form-row">
                <div class="input-group">
                    <label for="testIdgham">الإدغام (%):</label>
                    <input type="number" id="testIdgham" min="0" max="100">
                </div>
                <div class="input-group">
                    <label for="testIkhfa">الإخفاء (%):</label>
                    <input type="number" id="testIkhfa" min="0" max="100">
                </div>
                <div class="input-group">
                    <label for="testIqlab">الإقلاب (%):</label>
                    <input type="number" id="testIqlab" min="0" max="100">
                </div>
            </div>
        `;
    } else {
        fieldsHTML = `
            <div class="input-group">
                <label for="testLesson">اسم الدرس:</label>
                <input type="text" id="testLesson" required>
            </div>
            <div class="form-row">
                <div class="input-group">
                    <label for="testUnderstanding">الفهم (%):</label>
                    <input type="number" id="testUnderstanding" min="0" max="100">
                </div>
                <div class="input-group">
                    <label for="testApplication">التطبيق (%):</label>
                    <input type="number" id="testApplication" min="0" max="100">
                </div>
            </div>
        `;
    }

    testFields.innerHTML = fieldsHTML;
}

window.loadStudents = async function() {
    const token = document.getElementById('githubToken').value.trim();
    if (!token) {
        showAlert('الرجاء إدخال توكن GitHub صحيح', 'error');
        return;
    }

    try {
        showLoader(true);
        
        // محاولة جلب البيانات بطريقتين مختلفتين
        let data;
        
        // الطريقة 1: عبر GitHub API (للمستودعات الخاصة/العامة)
        try {
            const apiResponse = await fetch(GITHUB_API_URL, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3.raw'
                }
            });
            
            if (!apiResponse.ok) {
                throw new Error(`GitHub API Error: ${apiResponse.status}`);
            }
            
            data = await apiResponse.json();
            
            // إذا كانت البيانات مشفرة (base64)
            if (data.content) {
                data = JSON.parse(atob(data.content));
            }
        } catch (apiError) {
            console.log('محاولة GitHub API فشلت، جرب raw URL:', apiError);
            
            // الطريقة 2: عبر Raw URL (للمستودعات العامة فقط)
            const rawResponse = await fetch(`${DATA_URL}?t=${Date.now()}`);
            if (!rawResponse.ok) {
                throw new Error(`Raw URL Error: ${rawResponse.status}`);
            }
            data = await rawResponse.json();
        }

        if (!data.students) {
            throw new Error('هيكل البيانات غير صحيح (مفتاح students مفقود)');
        }

        currentData = data;
        renderStudentsTable(currentData.students);
        showAlert('تم تحميل بيانات الطلاب بنجاح', 'success');
    } catch (error) {
        console.error('Error:', error);
        showAlert(`خطأ في جلب البيانات: ${error.message}`, 'error');
    } finally {
        showLoader(false);
    }
};

function renderStudentsTable(students) {
    const tableBody = document.getElementById('studentsTable');
    tableBody.innerHTML = '';

    if (!students || students.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center">لا يوجد طلاب مسجلين</td>
            </tr>
        `;
        return;
    }

    students.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.id}</td>
            <td><img src="${student.image || 'https://via.placeholder.com/50'}" class="student-avatar" alt="صورة الطالب"></td>
            <td>${student.name}</td>
            <td>${student.level}</td>
            <td class="progress-cell">
                <div class="progress-bar-small">
                    <div style="width: ${student.progress || 0}%"></div>
                </div>
                <span>${student.progress || 0}%</span>
            </td>
            <td>
                <button class="btn warning" onclick="editStudent('${student.id}')">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="btn danger" onclick="showDeleteConfirm('${student.id}')">
                    <i class="fas fa-trash-alt"></i> حذف
                </button>
                <button class="btn" onclick="viewStudentDetails('${student.id}')">
                    <i class="fas fa-eye"></i> عرض
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// باقي الدوال (viewStudentDetails, editStudent, deleteStudent, etc...) تبقى كما هي
// مع التأكد من استخدام التوكن في جميع عمليات التحديث

async function updateGitHubFile(token, data, sha, message) {
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2)));
    return await fetch(GITHUB_API_URL, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
            message: message,
            content: content,
            sha: sha
        })
    });
}

// الدوال المساعدة
function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    alert.textContent = message;
    document.querySelector('.container').prepend(alert);
    alert.style.display = 'block';
    
    setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

function showLoader(show) {
    const loader = document.getElementById('loader') || createLoader();
    loader.style.display = show ? 'block' : 'none';
}

function createLoader() {
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.innerHTML = `
        <div class="loader-content">
            <div class="loader-spinner"></div>
            <p>جاري المعالجة...</p>
        </div>
    `;
    document.body.appendChild(loader);
    return loader;
}
