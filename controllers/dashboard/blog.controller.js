import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import formidable from 'formidable';
import slugify from 'slugify';
import { responseReturn } from '../../utils/response.js';
import { db } from '../../models/index.js';

// Setup directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadRoot = path.join(__dirname, '../../uploads');
const imageDir = path.join(uploadRoot, 'blogs');

// Ensure directories exist
[uploadRoot, imageDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

class blogControllers {
    create_blog = async (req, res) => {
        const form = formidable({ multiples: false, keepExtensions: true });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                return responseReturn(res, 400, { error: "Form parse error" });
            }

            try {
                // Extract and normalize fields
                const title = String(fields.title).trim();
                const category = String(fields.category).trim();
                const description1 = String(fields.description1).trim();
                const description2 = String(fields.description2).trim();
                const status = String(fields.status).trim();

                // Generate base slug
                const baseSlug = slugify(title, {
                    lower: true,
                    strict: true,    // remove special chars
                    locale: 'en'
                });

                // Ensure uniqueness: if same slug already exists, append timestamp
                let slug = baseSlug;
                const exists = await db.Blog.findOne({ where: { slug } });
                if (exists) {
                    slug = `${baseSlug}-${Date.now()}`;
                }

                // Handle image
                let image = files.image;
                if (Array.isArray(image)) {
                    image = image[0];
                }

                const serverUrl = `${req.protocol}://${req.get("host")}`;
                const timestamp = Date.now();
                const extension = path.extname(image.originalFilename || '');
                const safeName = `blog-${timestamp}${extension}`.replace(/\s+/g, "-");
                const newFilePath = path.join(imageDir, safeName);
                const imageUrl = `${serverUrl}/uploads/blogs/${safeName}`;

                fs.renameSync(image.filepath, newFilePath);

                // Create blog
                const blog = await db.Blog.create({
                    title,
                    slug,
                    category,
                    description1,
                    description2,
                    status,
                    image: imageUrl,
                });

                responseReturn(res, 201, { message: "created successfully", blog });
            } catch (error) {
                console.error(error);
                responseReturn(res, 500, { error: "Failed to create blog." });
            }
        });
    };

    get_all_blogs = async (req, res) => {
        try {
            const blogs = await db.Blog.findAll({ order: [["createdAt", "DESC"]] });
            res.json(blogs);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch blogs." });
        }
    };

    get_blog_details = async (req, res) => {

        const { slug } = req.params

        try {
            const blog = await db.Blog.findOne({ where: { slug } })

            // blog.clicks += 1;
            // await blog.save();

            responseReturn(res, 200, { blog })

        } catch (error) {
            console.error(error.message);
            responseReturn(res, 500, { error: 'Technical Error' });
        }

    }

    update_blog = async (req, res) => {
        const form = formidable({ multiples: false, keepExtensions: true });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                return res.status(400).json({ error: "Form parse error" });
            }

            try {
                const { blogId } = req.params;
                const blog = await db.Blog.findByPk(blogId);
                if (!blog) {
                    return res.status(404).json({ error: "Blog not found" });
                }

                // Normalize and assign fields
                blog.title = String(fields.title || blog.title).trim();
                blog.category = String(fields.category || blog.category).trim();
                blog.description1 = String(fields.description1 || blog.description1).trim();
                blog.description2 = String(fields.description2 || blog.description2).trim();
                blog.status = String(fields.status || blog.status).trim();

                // Handle new image (if any)
                let image = files.image;
                if (image) {
                    if (Array.isArray(image)) image = image[0];

                    const serverUrl = `${req.protocol}://${req.get("host")}`;
                    const timestamp = Date.now();
                    const extension = path.extname(image.originalFilename || '');
                    const safeName = `blog-${timestamp}${extension}`.replace(/\s+/g, "-");
                    const newFilePath = path.join(imageDir, safeName);
                    const imageUrl = `${serverUrl}/uploads/blogs/${safeName}`;

                    fs.renameSync(image.filepath, newFilePath);
                    blog.image = imageUrl;
                }

                await blog.save();

                res.json({ message: "updated successfully", blog });
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: "Failed to update blog." });
            }
        });
    };

    delete_blog = async (req, res) => {
        try {
            const { blogId } = req.params;
            const deleted = await db.Blog.destroy({ where: { blogId } });
            if (deleted) {
                res.json({ message: "Blog deleted." });
            } else {
                res.status(404).json({ error: "Blog not found." });
            }
        } catch (error) {
            res.status(500).json({ error: "Failed to delete blog." });
        }
    };
}

export default new blogControllers();