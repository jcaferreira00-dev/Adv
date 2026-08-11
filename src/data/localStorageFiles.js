// Versão local do upload de arquivos: em vez de subir para o Firebase Storage,
// converte o arquivo em base64 e guarda no próprio documento. Só é usada no
// modo de teste — para uso real, o app usa o Firebase Storage normalmente.

export async function uploadFile(uid, folder, file) {
  const url = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return { url, path: `demo:${folder}:${file.name}:${Date.now()}`, name: file.name };
}

export async function removeFile() {
  // No modo de teste não há nada para remover de um servidor.
  return Promise.resolve();
}
