document.addEventListener('DOMContentLoaded', () => {
    // Source - https://stackoverflow.com/a/75138428
// Posted by wassfila, modified by community. See post 'Timeline' for change history
// Retrieved 2026-11-18, License - CC BY-SA 4.0

const posts = import.meta.glob('../pages/blog/**/*.{md,mdx}')//relative to this component file
const component_path = process.cwd()+'/src/pages/blog/'
const Post_path = Object.keys(posts).find((path)=>(resolve(component_path,path) == page_path))

const random = Math.floor(Math.random() * months.length);
console.log(random, months[random]);

  document.getElementById("basket").href = randompage;

  
});