import { db } from "../../models/index.js";

class FAQControllers {

  create_FAQ = async (req, res) => {
    try {
      const { question, answer } = req.body;
      const faq = await db.FAQ.create({ question, answer });
      res.status(201).json(faq);
    } catch (err) {
      res.status(500).json({ error: "Failed to create FAQ", details: err.message });
    }
  }

  get_all_FAQs = async (req, res) => {
    try {
      const faqs = await db.FAQ.findAll({ order: [['createdAt', 'DESC']] });
      res.json(faqs);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch FAQs", details: err.message });
    }
  }

  get_FAQ_by_Id = async (req, res) => {
    try {
      const faq = await db.FAQ.findByPk(req.params.faqId);
      if (!faq) return res.status(404).json({ error: "FAQ not found" });
      res.json(faq);
    } catch (err) {
      res.status(500).json({ error: "Error fetching FAQ", details: err.message });
    }
  }

  update_FAQ = async (req, res) => {
    try {
      const faq = await db.FAQ.findByPk(req.params.faqId);
      if (!faq) return res.status(404).json({ error: "FAQ not found" });

      const { question, answer } = req.body;
      await faq.update({ question, answer });

      res.json(faq);
    } catch (err) {
      res.status(500).json({ error: "Failed to update FAQ", details: err.message });
    }
  }

  delete_FAQ = async (req, res) => {
    try {
      const faq = await db.FAQ.findByPk(req.params.faqId);
      if (!faq) return res.status(404).json({ error: "FAQ not found" });

      await faq.destroy();
      res.json({ message: "FAQ deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete FAQ", details: err.message });
    }
  };

}

export default new FAQControllers()