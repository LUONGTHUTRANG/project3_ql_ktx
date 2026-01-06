import db from "../config/db.js";

const Semester = {
  getAll: async () => {
    const [rows] = await db.query(
      "SELECT * FROM semesters ORDER BY start_date DESC"
    );
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.query("SELECT * FROM semesters WHERE id = ?", [id]);
    return rows[0];
  },

  getActiveSemester: async () => {
    const [rows] = await db.query(
      "SELECT * FROM semesters WHERE is_active = 1 LIMIT 1"
    );
    return rows[0];
  },

  create: async (data) => {
    const {
      term,
      academic_year,
      start_date,
      end_date,
      registration_open_date,
      registration_close_date,
      registration_special_open_date,
      registration_special_close_date,
      renewal_open_date,
      renewal_close_date,
      is_active,
    } = data;

    // Ensure start_date and end_date are YYYY-MM-DD
    const formatDate = (d) => {
      if (!d) return null;
      if (d.includes("T")) return d.split("T")[0];
      return d;
    };

    // Ensure datetime fields are YYYY-MM-DD HH:MM:SS
    const formatDateTime = (d) => {
      if (!d) return null;
      return new Date(d).toISOString().slice(0, 19).replace("T", " ");
    };

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      if (is_active) {
        await connection.query(
          "UPDATE semesters SET is_active = 0 WHERE is_active = 1"
        );
      }

      const [result] = await connection.query(
        "INSERT INTO semesters (term, academic_year, start_date, end_date, registration_open_date, registration_close_date, registration_special_open_date, registration_special_close_date, renewal_open_date, renewal_close_date, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          term,
          academic_year,
          formatDate(start_date),
          formatDate(end_date),
          formatDateTime(registration_open_date),
          formatDateTime(registration_close_date),
          formatDateTime(registration_special_open_date),
          formatDateTime(registration_special_close_date),
          formatDateTime(renewal_open_date),
          formatDateTime(renewal_close_date),
          is_active,
        ]
      );

      await connection.commit();
      return { id: result.insertId, ...data };
    } catch (error) {
      await connection.rollback();
      console.error("Error creating semester:", error);
      throw error;
    } finally {
      connection.release();
    }
  },

  update: async (id, data) => {
    const {
      term,
      academic_year,
      start_date,
      end_date,
      registration_open_date,
      registration_close_date,
      registration_special_open_date,
      registration_special_close_date,
      renewal_open_date,
      renewal_close_date,
      is_active,
    } = data;

    // Ensure start_date and end_date are YYYY-MM-DD
    const formatDate = (d) => {
      if (!d) return null;
      if (d.includes("T")) return d.split("T")[0];
      return d;
    };

    // Ensure datetime fields are YYYY-MM-DD HH:MM:SS
    const formatDateTime = (d) => {
      if (!d) return null;
      return new Date(d).toISOString().slice(0, 19).replace("T", " ");
    };

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      if (is_active) {
        await connection.query(
          "UPDATE semesters SET is_active = 0 WHERE id != ?",
          [id]
        );
      }

      await connection.query(
        "UPDATE semesters SET term = ?, academic_year = ?, start_date = ?, end_date = ?, registration_open_date = ?, registration_close_date = ?, registration_special_open_date = ?, registration_special_close_date = ?, renewal_open_date = ?, renewal_close_date = ?, is_active = ? WHERE id = ?",
        [
          term,
          academic_year,
          formatDate(start_date),
          formatDate(end_date),
          formatDateTime(registration_open_date),
          formatDateTime(registration_close_date),
          formatDateTime(registration_special_open_date),
          formatDateTime(registration_special_close_date),
          formatDateTime(renewal_open_date),
          formatDateTime(renewal_close_date),
          is_active,
          id,
        ]
      );

      await connection.commit();
      return { id, ...data };
    } catch (error) {
      await connection.rollback();
      console.error("Error updating semester:", error);
      throw error;
    } finally {
      connection.release();
    }
  },

  delete: async (id) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Delete related records first (Manual Cascade)
      await connection.query("DELETE FROM stay_records WHERE semester_id = ?", [
        id,
      ]);
      await connection.query(
        "DELETE FROM registrations WHERE semester_id = ?",
        [id]
      );
      await connection.query("DELETE FROM invoices WHERE semester_id = ?", [
        id,
      ]);

      // Finally delete the semester
      await connection.query("DELETE FROM semesters WHERE id = ?", [id]);

      await connection.commit();
      return { id };
    } catch (error) {
      await connection.rollback();
      console.error("Error deleting semester:", error);
      throw error;
    } finally {
      connection.release();
    }
  },
};

export default Semester;
