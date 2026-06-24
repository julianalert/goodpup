-- Remove legacy PawPlan branding and trailing brand suffixes from SEO titles.
-- Google already appends the site name, so titles should be topic-only.

update breeds
set meta_title = trim(regexp_replace(meta_title, '\s*[—–-]\s*Paw(Plan|Craft)\s*$', '', 'i'))
where meta_title ~* 'Paw(Plan|Craft)\s*$';

update breeds
set meta_description = replace(meta_description, 'PawPlan', 'PawCraft')
where meta_description ilike '%PawPlan%';

update problems
set meta_title = trim(regexp_replace(meta_title, '\s*[—–-]\s*Paw(Plan|Craft)\s*$', '', 'i'))
where meta_title ~* 'Paw(Plan|Craft)\s*$';

update problems
set meta_description = replace(meta_description, 'PawPlan', 'PawCraft')
where meta_description ilike '%PawPlan%';

update breed_problems
set meta_title = trim(regexp_replace(meta_title, '\s*[—–-]\s*Paw(Plan|Craft)\s*$', '', 'i'))
where meta_title ~* 'Paw(Plan|Craft)\s*$';

update breed_problems
set meta_description = replace(meta_description, 'PawPlan', 'PawCraft')
where meta_description ilike '%PawPlan%';
