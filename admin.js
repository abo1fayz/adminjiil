// admin.js - النسخة المصححة
const GITHUB_API_URL = "https://api.github.com/repos/abo1fayz/jiil/contents/data.json";
const DATA_URL = "https://raw.githubusercontent.com/abo1fayz/jiil/main/data.json";
let currentData = { students: [] };

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    setupTestTypeListener();
});

// إعداد مستمع لنوع الاختبار
function setupTestTypeListener() {
    document.getElementById('testType').addEventListener('change', function() {
        updateTestFields(this.value);
    });
    updateTestFields('quranTests'); // تهيئة الحقول الأولى
}

// تحديث حقول الاختبار ديناميكياً
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
    } else { // lessonTests
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

// تحميل بيانات الطلاب
window.loadStudents = async function() {
    const token = document.getElementById('githubToken').value;
    if (!token) {
        showAlert('الرجاء إدخال توكن GitHub للوصول للبيانات', 'error');
        return;
    }

    try {
        showLoader(true);
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error('فشل في جلب البيانات');
        
        currentData = await response.json();
        renderStudentsTable(currentData.students);
        showAlert('تم تحميل بيانات الطلاب بنجاح', 'success');
    } catch (error) {
        console.error('Error:', error);
        showAlert(`خطأ في جلب البيانات: ${error.message}`, 'error');
    } finally {
        showLoader(false);
    }
};

// عرض بيانات الطلاب في الجدول
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

// عرض تفاصيل الطالب في النافذة المنبثقة
function viewStudentDetails(studentId) {
    const student = currentData.students.find(s => s.id === studentId);
    if (!student) return;

    let detailsHTML = `
        <div class="student-details">
            <div class="detail-header">
                <img src="${student.image}" alt="صورة الطالب" class="detail-avatar">
                <div>
                    <h4>${student.name}</h4>
                    <p>رقم الطالب: ${student.id}</p>
                    <p>المستوى: ${student.level}</p>
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div style="width: ${student.progress || 0}%"></div>
                        </div>
                        <span>${student.progress || 0}%</span>
                    </div>
                </div>
            </div>
    `;

    // إضافة اختبارات القرآن
    if (student.quranTests && student.quranTests.length > 0) {
        detailsHTML += `
            <h4><i class="fas fa-book-quran"></i> أجزاء القرآن المختبرة</h4>
            <table class="details-table">
                <thead>
                    <tr>
                        <th>الجزء</th>
                        <th>الحفظ</th>
                        <th>التلاوة</th>
                        <th>التاريخ</th>
                    </tr>
                </thead>
                <tbody>
        `;

        student.quranTests.forEach(test => {
            detailsHTML += `
                <tr>
                    <td>${test.part}</td>
                    <td><span class="score-badge ${getScoreClass(test.memorization)}">${test.memorization}</span></td>
                    <td><span class="score-badge ${getScoreClass(test.recitation)}">${test.recitation}</span></td>
                    <td>${test.date}</td>
                </tr>
            `;
        });

        detailsHTML += `</tbody></table>`;
    }

    // إضافة اختبارات التجويد
    if (student.tajweedTests && student.tajweedTests.length > 0) {
        detailsHTML += `
            <h4><i class="fas fa-microphone-alt"></i> اختبارات التجويد</h4>
            <table class="details-table">
                <thead>
                    <tr>
                        <th>الاختبار</th>
                        <th>النتيجة</th>
                        <th>التاريخ</th>
                    </tr>
                </thead>
                <tbody>
        `;

        student.tajweedTests.forEach(test => {
            detailsHTML += `
                <tr>
                    <td>${test.test}</td>
                    <td><span class="score-badge ${getScoreClass(test.result)}">${test.result}</span></td>
                    <td>${test.date}</td>
                </tr>
            `;
        });

        detailsHTML += `</tbody></table>`;
    }

    // إضافة اختبارات الدروس
    if (student.lessonTests && student.lessonTests.length > 0) {
        detailsHTML += `
            <h4><i class="fas fa-graduation-cap"></i> اختبارات الدروس</h4>
            <table class="details-table">
                <thead>
                    <tr>
                        <th>الدرس</th>
                        <th>النتيجة</th>
                        <th>التاريخ</th>
                    </tr>
                </thead>
                <tbody>
        `;

        student.lessonTests.forEach(test => {
            detailsHTML += `
                <tr>
                    <td>${test.lesson}</td>
                    <td><span class="score-badge ${getScoreClass(test.result)}">${test.result}</span></td>
                    <td>${test.date}</td>
                </tr>
            `;
        });

        detailsHTML += `</tbody></table>`;
    }

    detailsHTML += `</div>`;

    document.getElementById('modalTitle').textContent = `تفاصيل الطالب: ${student.name}`;
    document.getElementById('modalBody').innerHTML = detailsHTML;
    openModal();
}

// فتح النافذة المنبثقة
function openModal() {
    document.getElementById('detailsModal').style.display = 'block';
}

// إغلاق النافذة المنبثقة
function closeModal() {
    document.getElementById('detailsModal').style.display = 'none';
}

// تأكيد الحذف
function showDeleteConfirm(studentId) {
    if (confirm('هل أنت متأكد من حذف هذا الطالب؟ لا يمكن التراجع عن هذه العملية.')) {
        deleteStudent(studentId);
    }
}

// حذف طالب
async function deleteStudent(studentId) {
    const token = document.getElementById('githubToken').value;
    if (!token) {
        showAlert('الرجاء إدخال توكن GitHub', 'error');
        return;
    }

    try {
        showLoader(true);
        const updatedStudents = currentData.students.filter(s => s.id !== studentId);
        const updatedData = { ...currentData, students: updatedStudents };

        const sha = await getFileSHA(token);
        const response = await updateGitHubFile(token, updatedData, sha, `حذف الطالب ${studentId}`);

        if (response.ok) {
            currentData = updatedData;
            renderStudentsTable(currentData.students);
            showAlert('تم حذف الطالب بنجاح', 'success');
        } else {
            throw new Error('فشل في تحديث البيانات على GitHub');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert(`خطأ في حذف الطالب: ${error.message}`, 'error');
    } finally {
        showLoader(false);
    }
}

// تعديل طالب
window.editStudent = function(studentId) {
    const student = currentData.students.find(s => s.id === studentId);
    if (!student) return;

    document.getElementById('studentId').value = student.id;
    document.getElementById('studentName').value = student.name;
    document.getElementById('studentImage').value = student.image || '';
    document.getElementById('studentLevel').value = student.level;

    // التمرير إلى نموذج التعديل
    document.getElementById('studentForm').scrollIntoView({ behavior: 'smooth' });
};

// حفظ بيانات الطالب
document.getElementById('studentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const token = document.getElementById('githubToken').value;
    if (!token) {
        showAlert('الرجاء إدخال توكن GitHub', 'error');
        return;
    }

    const studentId = document.getElementById('studentId').value;
    const studentName = document.getElementById('studentName').value;
    const studentImage = document.getElementById('studentImage').value;
    const studentLevel = document.getElementById('studentLevel').value;

    try {
        showLoader(true);
        const student = {
            id: studentId,
            name: studentName,
            image: studentImage,
            level: studentLevel,
            progress: 0,
            quranTests: [],
            tajweedTests: [],
            lessonTests: []
        };

        // البحث عن الطالب إذا كان موجوداً للحفاظ على اختباراته
        const existingStudent = currentData.students.find(s => s.id === studentId);
        if (existingStudent) {
            student.quranTests = existingStudent.quranTests || [];
            student.tajweedTests = existingStudent.tajweedTests || [];
            student.lessonTests = existingStudent.lessonTests || [];
            student.progress = existingStudent.progress || 0;
        }

        const updatedStudents = existingStudent 
            ? currentData.students.map(s => s.id === studentId ? student : s)
            : [...currentData.students, student];

        const updatedData = { ...currentData, students: updatedStudents };
        const sha = await getFileSHA(token);
        const message = existingStudent ? `تحديث بيانات الطالب ${studentId}` : `إضافة طالب جديد ${studentId}`;
        
        const response = await updateGitHubFile(token, updatedData, sha, message);

        if (response.ok) {
            currentData = updatedData;
            renderStudentsTable(currentData.students);
            this.reset();
            showAlert(`تم ${existingStudent ? 'تحديث' : 'إضافة'} الطالب بنجاح`, 'success');
        } else {
            throw new Error('فشل في تحديث البيانات على GitHub');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert(`خطأ في حفظ بيانات الطالب: ${error.message}`, 'error');
    } finally {
        showLoader(false);
    }
});

// إضافة اختبار جديد
document.getElementById('testForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const token = document.getElementById('githubToken').value;
    if (!token) {
        showAlert('الرجاء إدخال توكن GitHub', 'error');
        return;
    }

    const studentId = document.getElementById('testStudentId').value;
    const testType = document.getElementById('testType').value;
    const testResult = document.getElementById('testResult').value;
    const testDate = document.getElementById('testDate').value;
    const testNotes = document.getElementById('testNotes').value;

    try {
        showLoader(true);
        const studentIndex = currentData.students.findIndex(s => s.id === studentId);
        if (studentIndex === -1) {
            throw new Error('الطالب غير موجود');
        }

        let newTest = {
            result: testResult,
            date: testDate,
            notes: testNotes
        };

        // إضافة حقول إضافية حسب نوع الاختبار
        if (testType === 'quranTests') {
            newTest = {
                part: document.getElementById('testPart').value,
                memorization: document.getElementById('testMemorization').value,
                recitation: document.getElementById('testRecitation').value,
                ...newTest
            };
        } else if (testType === 'tajweedTests') {
            newTest = {
                test: document.getElementById('testName').value,
                idgham: document.getElementById('testIdgham').value,
                ikhfa: document.getElementById('testIkhfa').value,
                iqlab: document.getElementById('testIqlab').value,
                ...newTest
            };
        } else { // lessonTests
            newTest = {
                lesson: document.getElementById('testLesson').value,
                understanding: document.getElementById('testUnderstanding').value,
                application: document.getElementById('testApplication').value,
                ...newTest
            };
        }

        // تحديث بيانات الطالب
        const updatedStudents = [...currentData.students];
        updatedStudents[studentIndex][testType] = [...updatedStudents[studentIndex][testType], newTest];
        
        // حساب التقدم العام
        updatedStudents[studentIndex].progress = calculateOverallProgress(updatedStudents[studentIndex]);

        const updatedData = { ...currentData, students: updatedStudents };
        const sha = await getFileSHA(token);
        const response = await updateGitHubFile(token, updatedData, sha, `إضافة اختبار للطالب ${studentId}`);

        if (response.ok) {
            currentData = updatedData;
            renderStudentsTable(currentData.students);
            this.reset();
            showAlert('تم إضافة الاختبار بنجاح', 'success');
        } else {
            throw new Error('فشل في تحديث البيانات على GitHub');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert(`خطأ في إضافة الاختبار: ${error.message}`, 'error');
    } finally {
        showLoader(false);
    }
});

// حساب التقدم العام للطالب
function calculateOverallProgress(student) {
    let total = 0;
    let count = 0;

    // اختبارات القرآن
    if (student.quranTests && student.quranTests.length > 0) {
        const quranAvg = student.quranTests.reduce((sum, test) => {
            const mem = parseInt(test.memorization) || 0;
            const rec = parseInt(test.recitation) || 0;
            return sum + (mem + rec) / 2;
        }, 0) / student.quranTests.length;
        total += quranAvg;
        count++;
    }

    // اختبارات التجويد
    if (student.tajweedTests && student.tajweedTests.length > 0) {
        const tajweedAvg = student.tajweedTests.reduce((sum, test) => sum + (parseInt(test.result) || 0), 0) / student.tajweedTests.length;
        total += tajweedAvg;
        count++;
    }

    // اختبارات الدروس
    if (student.lessonTests && student.lessonTests.length > 0) {
        const lessonAvg = student.lessonTests.reduce((sum, test) => sum + (parseInt(test.result) || 0), 0) / student.lessonTests.length;
        total += lessonAvg;
        count++;
    }

    return count > 0 ? Math.round(total / count) : 0;
}

// الحصول على SHA لملف البيانات
async function getFileSHA(token) {
    const response = await fetch(GITHUB_API_URL, {
        headers: { 'Authorization': `token ${token}` }
    });
    const data = await response.json();
    return data.sha;
}

// تصحيح دالة تحديث ملف البيانات على GitHub
async function updateGitHubFile(token, data, sha, message) {
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
    return await fetch(GITHUB_API_URL, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: message,
            content: content,
            sha: sha
        })
    });
}

// تصنيف النتائج حسب النسبة
function getScoreClass(score) {
    const percent = parseInt(score) || 0;
    if (percent >= 90) return 'excellent';
    if (percent >= 80) return 'very-good';
    if (percent >= 70) return 'good';
    return 'weak';
}

// عرض التنبيهات
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

// عرض/إخفاء مؤشر التحميل
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

// إغلاق النافذة المنبثقة عند النقر خارجها
window.onclick = function(event) {
    const modal = document.getElementById('detailsModal');
    if (event.target === modal) {
        closeModal();
    }
};
