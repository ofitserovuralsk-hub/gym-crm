"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, type Role } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const MIN_PASSWORD_LENGTH = 10;

// Все действия — только для владельца. Проверка на сервере, а не только
// скрытие кнопок в UI.
async function requireOwner() {
  const user = await getCurrentUser();
  if (!user || user.role !== "owner") {
    throw new Error("Недостаточно прав: управлять сотрудниками может владелец");
  }
  return user;
}

function assertValidPassword(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов`);
  }
}

async function countOwners(): Promise<number> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error(`Не удалось загрузить сотрудников: ${error.message}`);
  return data.users.filter((u) => u.app_metadata?.role === "owner").length;
}

export async function createStaff(data: {
  email: string;
  password: string;
  role: Role;
}) {
  await requireOwner();
  const email = data.email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error("Укажите корректный email");
  }
  assertValidPassword(data.password);

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password: data.password,
    email_confirm: true,
    app_metadata: { role: data.role },
  });

  if (error) {
    throw new Error(`Не удалось создать сотрудника: ${error.message}`);
  }

  revalidatePath("/staff");
}

export async function changeStaffRole(userId: string, role: Role) {
  const me = await requireOwner();
  if (userId === me.id) {
    throw new Error("Свою роль менять нельзя");
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role },
  });

  if (error) {
    throw new Error(`Не удалось изменить роль: ${error.message}`);
  }

  revalidatePath("/staff");
}

export async function resetStaffPassword(userId: string, password: string) {
  await requireOwner();
  assertValidPassword(password);

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });

  if (error) {
    throw new Error(`Не удалось сменить пароль: ${error.message}`);
  }
}

export async function deleteStaff(userId: string) {
  const me = await requireOwner();
  if (userId === me.id) {
    throw new Error("Нельзя удалить самого себя");
  }

  const admin = createAdminClient();
  const { data: target, error: getError } =
    await admin.auth.admin.getUserById(userId);
  if (getError) {
    throw new Error(`Не удалось найти сотрудника: ${getError.message}`);
  }
  // Подстраховка: не оставляем зал без владельца.
  if (target.user?.app_metadata?.role === "owner" && (await countOwners()) <= 1) {
    throw new Error("Нельзя удалить последнего владельца");
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    throw new Error(`Не удалось удалить сотрудника: ${error.message}`);
  }

  revalidatePath("/staff");
}
