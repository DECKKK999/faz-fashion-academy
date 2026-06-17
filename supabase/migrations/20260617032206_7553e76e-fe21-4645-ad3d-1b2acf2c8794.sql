
-- Fix 1: Restrict lesson content (video_url, content) to enrolled users, free previews, instructors of the course, and admins.
DROP POLICY IF EXISTS "Anyone can view lessons of published courses" ON public.lessons;

-- Public/anon and authenticated can view free-preview lessons of published courses (metadata + content allowed for previews)
CREATE POLICY "Public can view free preview lessons"
ON public.lessons
FOR SELECT
TO anon, authenticated
USING (
  is_free_preview = true
  AND EXISTS (
    SELECT 1 FROM public.modules m
    JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = lessons.module_id AND c.is_published = true
  )
);

-- Enrolled users can view all lessons in courses they're enrolled in
CREATE POLICY "Enrolled users can view lessons"
ON public.lessons
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.modules m
    JOIN public.courses c ON c.id = m.course_id
    JOIN public.enrollments e ON e.course_id = c.id
    WHERE m.id = lessons.module_id
      AND e.user_id = auth.uid()
  )
);

-- Admins can view all lessons
CREATE POLICY "Admins can view all lessons"
ON public.lessons
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Instructors can view lessons of their own courses
CREATE POLICY "Instructors can view lessons of their courses"
ON public.lessons
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.modules m
    JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = lessons.module_id
      AND c.instructor_id = auth.uid()
      AND public.has_role(auth.uid(), 'instructor'::app_role)
  )
);

-- Fix 2 & 3: Enrollments — scope instructors to their own courses; allow users to self-enroll; admins keep full access.
DROP POLICY IF EXISTS "Admins and instructors can manage enrollments" ON public.enrollments;

CREATE POLICY "Admins can manage all enrollments"
ON public.enrollments
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Instructors can manage enrollments for their own courses"
ON public.enrollments
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'instructor'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = enrollments.course_id AND c.instructor_id = auth.uid()
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'instructor'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = enrollments.course_id AND c.instructor_id = auth.uid()
  )
);

-- Allow authenticated users to self-enroll in published courses (only for themselves)
CREATE POLICY "Users can self-enroll in published courses"
ON public.enrollments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = enrollments.course_id AND c.is_published = true
  )
);

-- Allow users to delete (unenroll) their own enrollments
CREATE POLICY "Users can unenroll themselves"
ON public.enrollments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
