const registration = document.getElementById('registration-form');
const statusMessage = document.getElementById('registration-status');
const submitButton = registration.querySelector('button[type="submit"]');
const { fullName, wish1, contactNumber, foodName, foodCategory, submissionId } = registration.elements;
const endpoint = registration.dataset.endpoint.trim();
const configured = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(endpoint);
const phonePattern = /^\+?[\d(). -]+$/;

if (configured) {
  registration.action = endpoint;
  registration.noValidate = true;
  submitButton.disabled = false;
  statusMessage.textContent = '';
}

function validateRegistration() {
  const checks = [
    [fullName, !fullName.value.trim(), '请输入你的中文全名。'],
    [contactNumber, !phonePattern.test(contactNumber.value.trim()) || !/\d/.test(contactNumber.value), '请输入有效的联系号码。'],
    [foodName, !foodName.value.trim(), '请输入你会带来的食物。'],
    [foodCategory[0], !foodCategory.value, '请选择食物类别。'],
    [wish1, !wish1.value.trim(), '请至少填写一个圣诞愿望。']
  ];
  let firstInvalid;

  for (const [field, invalid, message] of checks) {
    if (!invalid) continue;
    field.setAttribute('aria-invalid', 'true');
    firstInvalid ??= { field, message };
  }

  for (const field of registration.querySelectorAll('[maxlength]')) {
    if (field.value.trim().length > field.maxLength && !firstInvalid) {
      field.setAttribute('aria-invalid', 'true');
      firstInvalid = { field, message: `请输入不超过 ${field.maxLength} 个字符的内容。` };
    }
  }

  return firstInvalid;
}

registration.addEventListener('input', (event) => {
  const field = event.target.name === 'foodCategory' ? foodCategory[0] : event.target;
  field.removeAttribute('aria-invalid');
});

registration.addEventListener('submit', (event) => {
  if (!configured || submitButton.disabled) {
    event.preventDefault();
    return;
  }

  const invalid = validateRegistration();
  if (invalid) {
    event.preventDefault();
    statusMessage.textContent = invalid.message;
    invalid.field.focus();
    return;
  }

  // Store only the attempt ID in history, so Back and retry use the same ID.
  submissionId.value ||= history.state?.registrationId || crypto.randomUUID();
  history.replaceState({ ...history.state, registrationId: submissionId.value }, '');
  submitButton.disabled = true;
  statusMessage.textContent = '正在提交报名，请稍候…';
});

addEventListener('pageshow', (event) => {
  if (configured) {
    submitButton.disabled = false;
    statusMessage.textContent = event.persisted && submissionId.value
      ? '如未收到报名确认，可使用原报名编号再次提交。'
      : '';
  }
});
